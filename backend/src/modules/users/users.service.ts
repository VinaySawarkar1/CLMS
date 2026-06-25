import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  labId: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(labId?: string) {
    return this.prisma.user.findMany({
      where: labId ? { labId } : undefined,
      select: PUBLIC_SELECT,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRole(id: string, role: Role) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id }, data: { role }, select: PUBLIC_SELECT });
  }

  async setActive(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id }, data: { isActive }, select: PUBLIC_SELECT });
  }
}
