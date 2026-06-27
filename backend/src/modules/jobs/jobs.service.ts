import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.module';
import { CreateJobDto, CreateJobBatchDto } from './dto';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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
      masterInstrumentId: dto.masterInstrumentId,
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

  /**
   * Create a multi-instrument intake for one customer (Module 2.1). Produces a
   * JobBatch and one Job per instrument so each instrument has its own
   * calibration status, datasheets and certificate. Batch-level administrative
   * fields (challan/PO/onsite) are copied to every job for the certificate.
   */
  async createBatch(labId: string, dto: CreateJobBatchDto) {
    if (!dto.instruments?.length) {
      throw new BadRequestException('At least one instrument is required');
    }

    // Validate every instrument belongs to this lab and the given customer.
    const instrumentIds = dto.instruments.map((i) => i.instrumentId);
    const instruments = await this.prisma.instrument.findMany({
      where: { id: { in: instrumentIds }, labId },
      select: { id: true, customerId: true },
    });
    const byId = new Map(instruments.map((i) => [i.id, i]));
    for (const line of dto.instruments) {
      const inst = byId.get(line.instrumentId);
      if (!inst) throw new BadRequestException(`Instrument ${line.instrumentId} not found in this lab`);
      if (inst.customerId !== dto.customerId) {
        throw new BadRequestException('All instruments in a batch must belong to the selected customer');
      }
    }

    const visitDate = dto.visitDate ? new Date(dto.visitDate) : null;

    return this.prisma.$transaction(async (tx) => {
      // Allocate a batch number (retry on rare collision).
      let batch;
      for (let attempt = 0; attempt < 5; attempt++) {
        const batchNumber = await this.nextBatchNumber(labId, tx);
        try {
          batch = await tx.jobBatch.create({
            data: {
              labId,
              customerId: dto.customerId,
              batchNumber,
              challanNo: dto.challanNo,
              poNumber: dto.poNumber,
              remarks: dto.remarks,
              isOnsite: dto.isOnsite ?? false,
              siteAddress: dto.siteAddress,
            },
          });
          break;
        } catch (e: any) {
          if (e?.code === 'P2002' && attempt < 4) continue;
          throw e;
        }
      }
      if (!batch) throw new Error('Could not allocate a unique batch number');

      // One job per instrument, each with its own sequential job number.
      const jobs: any[] = [];
      for (const line of dto.instruments) {
        let created;
        for (let attempt = 0; attempt < 5; attempt++) {
          const jobNumber = await this.nextJobNumber(labId, tx);
          try {
            created = await tx.job.create({
              data: {
                labId,
                batchId: batch.id,
                customerId: dto.customerId,
                instrumentId: line.instrumentId,
                jobNumber,
                status: 'RECEIVED',
                challanNo: dto.challanNo,
                poNumber: dto.poNumber,
                conditionOfItem: line.conditionOfItem ?? 'OK (As Received)',
                calibrationProcedure: line.calibrationProcedure,
                calibrationProcedureNo: line.calibrationProcedureNo,
                referenceDocumentNo: line.referenceDocumentNo,
                procedureId: line.procedureId,
                procedureRangeIndex: line.procedureRangeIndex,
                unitOfMeasurement: line.unitOfMeasurement,
                masterInstrumentId: line.masterInstrumentId,
                remarks: line.remarks ?? dto.remarks,
                isOnsite: dto.isOnsite ?? false,
                siteAddress: dto.siteAddress,
                siteContact: dto.siteContact,
                visitDate,
              },
            });
            break;
          } catch (e: any) {
            if (e?.code === 'P2002' && attempt < 4) continue;
            throw e;
          }
        }
        if (!created) throw new Error('Could not allocate a unique job number');
        jobs.push(created);
      }

      return { ...batch, jobs };
    });
  }

  /** List batches for the lab (optionally filtered by customer) with rollup. */
  async listBatches(labId: string, customerId?: string) {
    const batches = await this.prisma.jobBatch.findMany({
      where: { labId, ...(customerId ? { customerId } : {}) },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        jobs: {
          include: { instrument: { select: { name: true, serialNumber: true } }, certificate: { select: { id: true, certificateNumber: true, isLocked: true } } },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
    return batches.map((b) => ({ ...b, summary: this.batchSummary(b.jobs) }));
  }

  async getBatch(id: string, labId: string) {
    const batch = await this.prisma.jobBatch.findFirst({
      where: { id, labId },
      include: {
        customer: true,
        jobs: {
          include: {
            instrument: true,
            engineer: { include: { user: { select: { fullName: true } } } },
            certificate: { select: { id: true, certificateNumber: true, isLocked: true, revision: true } },
          },
          orderBy: { jobNumber: 'asc' },
        },
      },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return { ...batch, summary: this.batchSummary(batch.jobs) };
  }

  /** Roll up the individual job statuses into batch-level progress counts. */
  private batchSummary(jobs: { status: JobStatus }[]) {
    const total = jobs.length;
    const certified = jobs.filter((j) =>
      ['CERTIFICATE_GENERATED', 'DELIVERED', 'CLOSED'].includes(j.status)).length;
    const closed = jobs.filter((j) => j.status === 'CLOSED').length;
    const inProgress = total - certified;
    const overall = total === 0
      ? 'EMPTY'
      : closed === total
        ? 'CLOSED'
        : certified === total
          ? 'CERTIFIED'
          : 'IN_PROGRESS';
    return { total, certified, closed, inProgress, overall };
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
      include: {
        customer: true, instrument: true, engineer: true, certificate: true, masterInstrument: true,
        batch: { select: { id: true, batchNumber: true } },
      },
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
        masterInstrument: true,
        datasheets: true,
        certificate: { include: { signatures: { orderBy: { signedAt: 'asc' } } } },
        batch: {
          select: {
            id: true, batchNumber: true,
            jobs: {
              select: {
                id: true, jobNumber: true, status: true,
                instrument: { select: { name: true, serialNumber: true } },
              },
              orderBy: { jobNumber: 'asc' },
            },
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async assignEngineer(id: string, labId: string, engineerId: string) {
    const job = await this.findOne(id, labId);
    const next = job.status === 'RECEIVED' || job.status === 'WAITING' ? 'ASSIGNED' : job.status;
    const updated = await this.prisma.job.update({ where: { id }, data: { engineerId, status: next } });

    // Notify the assigned engineer (Module 15).
    const engineer = await this.prisma.engineer.findUnique({
      where: { id: engineerId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (engineer?.user) {
      await this.notifications.notify({
        labId, userId: engineer.user.id, channel: 'EMAIL', event: 'JOB_ASSIGNED',
        payload: { jobId: id, jobNumber: job.jobNumber, email: engineer.user.email, message: `Job ${job.jobNumber} has been assigned to you.` },
      });
    }
    return updated;
  }

  async updateStatus(id: string, labId: string, status: JobStatus) {
    const job = await this.findOne(id, labId);
    if (!TRANSITIONS[job.status].includes(status)) {
      throw new BadRequestException(`Invalid transition ${job.status} → ${status}`);
    }
    const updated = await this.prisma.job.update({ where: { id }, data: { status } });

    // Notify the customer when the instrument is delivered (Module 15).
    if (status === 'DELIVERED') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: job.customerId }, select: { email: true, phone: true },
      });
      if (customer?.email) {
        await this.notifications.notifyMany({
          labId, channels: ['EMAIL', 'WHATSAPP'], event: 'DELIVERY',
          payload: { jobId: id, jobNumber: job.jobNumber, email: customer.email, phone: customer.phone, message: `Your instrument (Job ${job.jobNumber}) has been delivered.` },
        });
      }
    }
    return updated;
  }

  async deleteJob(id: string, labId: string) {
    await this.findOne(id, labId);
    return this.prisma.job.delete({ where: { id } });
  }

  async updateJob(id: string, labId: string, data: Record<string, any>) {
    await this.findOne(id, labId);
    const allowed = ['remarks', 'challanNo', 'poNumber', 'conditionOfItem', 'calibrationProcedure', 'calibrationProcedureNo', 'referenceDocumentNo'];
    const safe = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    return this.prisma.job.update({ where: { id }, data: safe });
  }

  private async nextJobNumber(labId: string, client?: any): Promise<string> {
    const db = client ?? this.prisma;
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}-`;
    // Derive the next sequence from the highest existing suffix (not the row
    // count), so deletions or pre-seeded numbers never cause a collision.
    const existing = await db.job.findMany({
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

  private async nextBatchNumber(labId: string, client?: any): Promise<string> {
    const db = client ?? this.prisma;
    const year = new Date().getFullYear();
    const prefix = `BATCH-${year}-`;
    const existing = await db.jobBatch.findMany({
      where: { labId, batchNumber: { startsWith: prefix } },
      select: { batchNumber: true },
    });
    let max = 0;
    for (const { batchNumber } of existing) {
      const n = parseInt(batchNumber.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }
}
