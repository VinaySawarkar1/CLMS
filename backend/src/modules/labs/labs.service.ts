import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LabStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterLabDto } from '../auth/dto';

const ALL_PERMISSION_KEYS = [
  'customers', 'instruments', 'jobs', 'certificates', 'billing',
  'tasks', 'engineers', 'inventory', 'environmental', 'quality', 'audit', 'notifications',
];

/** Default granted permissions per role (applied when a new lab is registered) */
const DEFAULT_GRANTS: Record<string, string[]> = {
  TECHNICAL_MANAGER: ALL_PERMISSION_KEYS,
  CALIBRATION_ENGINEER: ['customers', 'instruments', 'jobs', 'certificates', 'tasks', 'environmental'],
  SERVICE_ENGINEER: ['customers', 'instruments', 'jobs', 'tasks'],
  DATA_ENTRY_OPERATOR: ['customers', 'instruments', 'jobs', 'notifications'],
};

@Injectable()
export class LabsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Public: register a new lab + LAB_ADMIN user. Lab starts PENDING until SUPER_ADMIN approves. */
  async registerLab(dto: RegisterLabDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.adminEmail } });
    if (existingUser) throw new ConflictException('Admin email already registered');

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const lab = await tx.lab.create({
        data: {
          name: dto.labName,
          accreditationNumber: dto.accreditationNumber,
          address: dto.address,
          contactEmail: dto.contactEmail,
          status: LabStatus.PENDING,
        },
      });

      const admin = await tx.user.create({
        data: {
          email: dto.adminEmail,
          passwordHash,
          fullName: dto.adminFullName,
          role: Role.LAB_ADMIN,
          labId: lab.id,
        },
      });

      // Seed default permissions
      for (const [role, granted] of Object.entries(DEFAULT_GRANTS)) {
        for (const key of ALL_PERMISSION_KEYS) {
          await tx.labRolePermission.create({
            data: { labId: lab.id, role: role as Role, permissionKey: key, granted: granted.includes(key) },
          });
        }
      }

      await tx.auditLog.create({
        data: { labId: lab.id, userId: admin.id, action: 'LAB_REGISTERED', entity: 'Lab', entityId: lab.id },
      });

      return { lab, admin };
    });

    return {
      message: 'Lab registered. Awaiting SUPER_ADMIN approval.',
      labId: result.lab.id,
      labName: result.lab.name,
      status: result.lab.status,
    };
  }

  /** SUPER_ADMIN: list all labs */
  findAll(status?: LabStatus) {
    return this.prisma.lab.findMany({
      where: status ? { status } : undefined,
      include: { _count: { select: { users: true, jobs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actorLabId?: string | null) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: { _count: { select: { users: true, jobs: true, customers: true } } },
    });
    if (!lab) throw new NotFoundException('Lab not found');
    if (actorLabId && actorLabId !== id) throw new ForbiddenException('Access denied');
    return lab;
  }

  /** SUPER_ADMIN: approve, reject, or suspend a lab */
  async updateStatus(id: string, status: LabStatus, actorId: string) {
    await this.findOne(id);
    const lab = await this.prisma.lab.update({ where: { id }, data: { status } });
    await this.prisma.auditLog.create({
      data: { labId: id, userId: actorId, action: `LAB_${status}`, entity: 'Lab', entityId: id },
    });
    return lab;
  }

  /** LAB_ADMIN: get permissions matrix for their lab */
  async getPermissions(labId: string) {
    const rows = await this.prisma.labRolePermission.findMany({
      where: { labId },
      select: { role: true, permissionKey: true, granted: true },
    });
    // Return as a nested map: { TECHNICAL_MANAGER: { customers: true, ... }, ... }
    const matrix: Record<string, Record<string, boolean>> = {};
    for (const row of rows) {
      if (!matrix[row.role]) matrix[row.role] = {};
      matrix[row.role][row.permissionKey] = row.granted;
    }
    return matrix;
  }

  /** LAB_ADMIN: save full permissions matrix */
  async savePermissions(labId: string, matrix: { role: Role; permissionKey: string; granted: boolean }[]) {
    await this.prisma.$transaction(
      matrix.map((item) =>
        this.prisma.labRolePermission.upsert({
          where: { labId_role_permissionKey: { labId, role: item.role, permissionKey: item.permissionKey } },
          update: { granted: item.granted },
          create: { labId, role: item.role, permissionKey: item.permissionKey, granted: item.granted },
        }),
      ),
    );
    return this.getPermissions(labId);
  }

  /** LAB_ADMIN: list users in their lab */
  async getLabUsers(labId: string) {
    return this.prisma.user.findMany({
      where: { labId },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** LAB_ADMIN: create a user in their lab */
  async createLabUser(labId: string, data: {
    email: string; fullName: string; password: string; role: Role;
    employeeCode?: string; skills?: string[];
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    const allowedRoles: Role[] = [Role.TECHNICAL_MANAGER, Role.CALIBRATION_ENGINEER, Role.SERVICE_ENGINEER, Role.DATA_ENTRY_OPERATOR];
    if (!allowedRoles.includes(data.role)) {
      throw new ForbiddenException('Cannot assign this role');
    }

    const isEngineerRole = data.role === Role.CALIBRATION_ENGINEER || data.role === Role.SERVICE_ENGINEER;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          passwordHash: await bcrypt.hash(data.password, 10),
          role: data.role,
          labId,
        },
        select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      });

      if (isEngineerRole) {
        let employeeCode = data.employeeCode?.trim();
        if (!employeeCode) {
          const count = await tx.engineer.count({ where: { user: { labId } } });
          employeeCode = `ENG-${String(count + 1).padStart(3, '0')}`;
        }
        // Ensure employeeCode is unique within the lab
        const codeExists = await tx.engineer.findFirst({ where: { employeeCode, user: { labId } } });
        if (codeExists) throw new ConflictException(`Employee code ${employeeCode} already exists`);

        await tx.engineer.create({
          data: {
            userId: user.id,
            employeeCode,
            skills: data.skills ?? [],
            authorizations: [],
          },
        });
      }

      return user;
    });
  }

  /** LAB_ADMIN: change a user's role */
  async updateUserRole(labId: string, userId: string, role: Role) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, labId } });
    if (!user) throw new NotFoundException('User not found in this lab');

    const allowedRoles: Role[] = [Role.TECHNICAL_MANAGER, Role.CALIBRATION_ENGINEER, Role.SERVICE_ENGINEER, Role.DATA_ENTRY_OPERATOR];
    if (!allowedRoles.includes(role)) throw new ForbiddenException('Cannot assign this role');

    const isEngineerRole = role === Role.CALIBRATION_ENGINEER || role === Role.SERVICE_ENGINEER;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, fullName: true, role: true, isActive: true },
      });

      if (isEngineerRole) {
        const existing = await tx.engineer.findUnique({ where: { userId } });
        if (!existing) {
          const count = await tx.engineer.count({ where: { user: { labId } } });
          const employeeCode = `ENG-${String(count + 1).padStart(3, '0')}`;
          await tx.engineer.create({
            data: { userId, employeeCode, skills: [], authorizations: [] },
          });
        }
      }

      return updated;
    });
  }

  /** LAB_ADMIN: activate or deactivate a user */
  async setUserActive(labId: string, userId: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, labId } });
    if (!user) throw new NotFoundException('User not found in this lab');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
  }

  /** SUPER_ADMIN: reset a lab user's password */
  async resetUserPassword(labId: string, userId: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, labId } });
    if (!user) throw new NotFoundException('User not found in this lab');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
