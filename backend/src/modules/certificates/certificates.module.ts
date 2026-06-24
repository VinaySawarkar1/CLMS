import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { MailService } from '../../common/mail/mail.service';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, MailService],
})
export class CertificatesModule {}
