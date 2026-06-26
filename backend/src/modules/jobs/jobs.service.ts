import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateJobDto } from './dto';

const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  RECEIVED: ['WAITING', 'ASSIGNED'],
  WAITING: ['ASSIGNED'],
  ASSIGNED: ['IN_CALIBRATION'],
  IN_CALIBRATION: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['CORRECTION_REQUIRED', 'APPROVED'],
  CORRECTION_REQUIRED: ['IN_CALIBRATION'],
  APPROVED: ['CERTIFICATE_GENERATED'],
  CERTIFICATE_GENERATED: ['DELIVERED'],
  DELIVERED: ['CLOSED'],
  CLOSED: [],
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(labId: string, dto: CreateJobDto) {
    const data = {
      labId,
      customerId: dto.customerId,
      instrumentId: dto.instrumentId,
      remarks: dto.remarks,
      challanNo: dto.challanNo,
      poNumber: dto.poNumber,
      conditionOfItem: dto.conditionOfItem ?? 'OK (As Received)',
      calibrationProcedureNo: dto.calibrationProcedureNo,
      referenceDocumentNo: dto.referenceDocumentNo,
      calibrationProcedure: dto.calibrationProcedure,
      procedureId: dto.procedureId,
      procedureRangeIndex: dto.procedureRangeIndex,
      unitOfMeasurement: dto.unitOfMeasurement,
      isOnsite: dto.isOnsite ?? false,
      siteAddress: dto.siteAddress,
      siteContact: dto.siteContact,
      visitDate: dto.visitDate ? new Date(dto.visitDate) : null,
      status: 'RECEIVED' as JobStatus,
    };

    // Retry on unique-constraint collision of jobNumber (concurrent creates).
    for (let attempt = 0; attempt < 5; attempt++) {
      const jobNumber = await this.nextJobNumber(labId);
      try {
        return await this.prisma.job.create({ data: { ...data, jobNumber } });
      } catch (e: any) {
        if (e?.code === 'P2002' && attempt < 4) continue;
        throw e;
      }
    }
    throw new Error('Could not allocate a unique job number');
  }

  async findAll(labId: string, status?: JobStatus, user?: { id: string; role: string }) {
    // Engineers only see jobs assigned to them; managers/admins see all.
    let engineerFilter = {};
    if (user && (user.role === 'CALIBRATION_ENGINEER' || user.role === 'SERVICE_ENGINEER')) {
      const engineer = await this.prisma.engineer.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      // If the user isn't linked to an engineer record, they see nothing.
      engineerFilter = { engineerId: engineer?.id ?? '__none__' };
    }
    return this.prisma.job.findMany({
      where: { labId, ...(status ? { status } : {}), ...engineerFilter },
      include: { customer: true, instrument: true, engineer: true, certificate: true },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, labId },
      include: {
        customer: true,
        instrument: true,
        engineer: true,
        datasheets: true,
        certificate: { include: { signatures: { orderBy: { signedAt: 'asc' } } } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async assignEngineer(id: string, labId: string, engineerId: string) {
    const job = await this.findOne(id, labId);
    const next = job.status === 'RECEIVED' || job.status === 'WAITING' ? 'ASSIGNED' : job.status;
    return this.prisma.job.update({ where: { id }, data: { engineerId, status: next } });
  }

  async updateStatus(id: string, labId: string, status: JobStatus) {
    const job = await this.findOne(id, labId);
    if (!TRANSITIONS[job.status].includes(status)) {
      throw new BadRequestException(`Invalid transition ${job.status} → ${status}`);
    }
    return this.prisma.job.update({ where: { id }, data: { status } });
  }

  async updateJob(id: string, labId: string, data: Record<string, any>) {
    await this.findOne(id, labId); // ensures ownership
    const allowed = ['remarks', 'challanNo', 'poNumber', 'conditionOfItem', 'calibrationProcedure', 'calibrationProcedureNo', 'referenceDocumentNo'];
    const safe = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    return this.prisma.job.update({ where: { id }, data: safe });
  }

  private async nextJobNumber(labId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}-`;
    // Derive the next sequence from the highest existing suffix (not the row
    // count), so deletions or pre-seeded numbers never cause a collision.
    const existing = await this.prisma.job.findMany({
      where: { labId, jobNumber: { startsWith: prefix } },
      select: { jobNumber: true },
    });
    let max = 0;
    for (const { jobNumber } of existing) {
      const n = parseInt(jobNumber.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }
}
