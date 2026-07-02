import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface CreateComplaintDto {
  customerId?: string;
  certificateId?: string;
  subject?: string;
  description?: string;
  rootCause?: string;
  investigation?: string;
  capa?: string;
}

interface UpdateComplaintDto {
  subject?: string;
  description?: string;
  rootCause?: string;
  investigation?: string;
  capa?: string;
  status?: string;
  closureRemarks?: string;
}

@Injectable()
class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(labId: string) {
    return this.prisma.complaint.findMany({
      where: { labId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(labId: string, raisedById: string, dto: CreateComplaintDto) {
    if (!dto.description) {
      throw new BadRequestException('description is required');
    }
    const data = {
      labId,
      raisedById,
      customerId: dto.customerId,
      certificateId: dto.certificateId,
      subject: dto.subject,
      description: dto.description,
      rootCause: dto.rootCause,
      investigation: dto.investigation,
      capa: dto.capa,
    };

    // Retry on unique-constraint collision of complaintNo (concurrent creates).
    for (let attempt = 0; attempt < 5; attempt++) {
      const complaintNo = await this.nextComplaintNo(labId);
      try {
        return await this.prisma.complaint.create({
          data: { ...data, complaintNo },
        });
      } catch (e: any) {
        if (e?.code === 'P2002' && attempt < 4) continue;
        throw e;
      }
    }
    throw new Error('Could not allocate a unique complaint number');
  }

  async update(id: string, labId: string, dto: UpdateComplaintDto) {
    const existing = await this.prisma.complaint.findFirst({
      where: { id, labId },
    });
    if (!existing) throw new NotFoundException('Complaint not found');

    const data: Record<string, any> = {
      subject: dto.subject,
      description: dto.description,
      rootCause: dto.rootCause,
      investigation: dto.investigation,
      capa: dto.capa,
      status: dto.status,
      closureRemarks: dto.closureRemarks,
    };
    // Drop undefined keys so we only update provided fields.
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    if (dto.status === 'CLOSED') {
      data.closedAt = new Date();
    }

    return this.prisma.complaint.update({ where: { id }, data });
  }

  async remove(id: string, labId: string) {
    const existing = await this.prisma.complaint.findFirst({
      where: { id, labId },
    });
    if (!existing) throw new NotFoundException('Complaint not found');
    return this.prisma.complaint.delete({ where: { id } });
  }

  private async nextComplaintNo(labId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CMP/${year}/`;
    // Derive the next sequence from the highest existing suffix (not the row
    // count), so deletions or pre-seeded numbers never cause a collision.
    const existing = await this.prisma.complaint.findMany({
      where: { labId, complaintNo: { startsWith: prefix } },
      select: { complaintNo: true },
    });
    let max = 0;
    for (const { complaintNo } of existing) {
      const n = parseInt(complaintNo.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }
}

@UseGuards(JwtAuthGuard)
@Controller('complaints')
class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get()
  list(@Request() req: any) {
    return this.complaints.findAll(req.user.labId);
  }

  @Post()
  create(@Request() req: any, @Body() body: CreateComplaintDto) {
    return this.complaints.create(req.user.labId, req.user.id, body);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: UpdateComplaintDto) {
    return this.complaints.update(id, req.user.labId, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.complaints.remove(id, req.user.labId);
  }
}

@Module({
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
})
export class ComplaintsModule {}
