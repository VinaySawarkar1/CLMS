import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateJobDto } from './dto';

/** Allowed status transitions for the calibration workflow. */
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

  async create(dto: CreateJobDto) {
    const jobNumber = await this.nextJobNumber();
    const job = await this.prisma.job.create({
      data: {
        jobNumber,
        customerId: dto.customerId,
        instrumentId: dto.instrumentId,
        branchId: dto.branchId,
        remarks: dto.remarks,
        status: 'RECEIVED',
      },
    });
    return job;
  }

  findAll(status?: JobStatus) {
    return this.prisma.job.findMany({
      where: status ? { status } : undefined,
      include: { customer: true, instrument: true, engineer: true },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
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

  async assignEngineer(id: string, engineerId: string) {
    const job = await this.findOne(id);
    const next = job.status === 'RECEIVED' || job.status === 'WAITING'
      ? 'ASSIGNED'
      : job.status;
    return this.prisma.job.update({
      where: { id },
      data: { engineerId, status: next },
    });
  }

  async updateStatus(id: string, status: JobStatus) {
    const job = await this.findOne(id);
    if (!TRANSITIONS[job.status].includes(status)) {
      throw new BadRequestException(
        `Invalid transition ${job.status} → ${status}`,
      );
    }
    return this.prisma.job.update({ where: { id }, data: { status } });
  }

  private async nextJobNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}-`;
    const count = await this.prisma.job.count({
      where: { jobNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
}
