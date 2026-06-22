import {
  Controller,
  Get,
  Header,
  Injectable,
  Module,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CertificateReportData,
  renderCertificateHtml,
} from '../../common/report/report-engine';
import { buildQrPayload } from '../../common/qr/qr-engine';

@Injectable()
class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Assemble the report data model for a certificate and render it to HTML. */
  async certificateHtml(certificateId: string): Promise<string> {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        signatures: { orderBy: { signedAt: 'asc' } },
        job: {
          include: {
            customer: true,
            instrument: true,
            datasheets: {
              orderBy: { version: 'desc' },
              take: 1,
              include: { observations: true, uncertainty: true },
            },
          },
        },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');

    const datasheet = cert.job.datasheets[0];
    const env = (datasheet?.environmental as any) ?? null;
    const qr = buildQrPayload({
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      issueDate: cert.issueDate,
      contentHash: cert.qrHash ?? '',
    });

    const data: CertificateReportData = {
      certificateNumber: cert.certificateNumber,
      type: cert.type,
      issueDate: cert.issueDate,
      customerName: cert.job.customer.name,
      instrumentName: cert.job.instrument.name,
      instrumentMake: cert.job.instrument.make,
      instrumentModel: cert.job.instrument.model,
      instrumentSerial: cert.job.instrument.serialNumber,
      jobNumber: cert.job.jobNumber,
      environmental: env,
      observations: datasheet?.observations ?? [],
      expandedUncertainty: datasheet?.uncertainty?.expandedUncertainty ?? null,
      coverageFactor: datasheet?.uncertainty?.coverageFactor ?? null,
      decisionRule: cert.decisionRule,
      qrVerificationUrl: qr.verificationUrl,
      signatures: cert.signatures.map((s) => ({ stage: s.stage, by: s.signedByName })),
    };
    return renderCertificateHtml(data);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('reports')
class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('certificate/:id.html')
  @Header('Content-Type', 'text/html')
  certificateHtml(@Param('id') id: string) {
    return this.reports.certificateHtml(id);
  }
}

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
