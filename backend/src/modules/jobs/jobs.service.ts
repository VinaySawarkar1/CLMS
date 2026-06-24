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
    const jobNumber = await this.nextJobNumber(labId);
    return this.prisma.job.create({
      data: {
        jobNumber,
        labId,
        customerId: dto.customerId,
        instrumentId: dto.instrumentId,
        remarks: dto.remarks,
        isOnsite: dto.isOnsite ?? false,
        siteAddress: dto.siteAddress,
        siteContact: dto.siteContact,
        visitDate: dto.visitDate ? new Date(dto.visitDate) : null,
        status: 'RECEIVED',
      },
    });
  }

  findAll(labId: string, status?: JobStatus) {
    return this.prisma.job.findMany({
      where: { labId, ...(status ? { status } : {}) },
      include: { customer: true, instrument: true, engineer: true },
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

  private async nextJobNumber(labId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}-`;
    const count = await this.prisma.job.count({ where: { labId, jobNumber: { startsWith: prefix } } });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
}
