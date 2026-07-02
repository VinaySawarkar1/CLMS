import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InstrumentsModule } from './modules/instruments/instruments.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { DatasheetsModule } from './modules/datasheets/datasheets.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { EngineersModule } from './modules/engineers/engineers.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BillingModule } from './modules/billing/billing.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { QualityModule } from './modules/quality/quality.module';
import { EnvironmentalModule } from './modules/environmental/environmental.module';
import { PortalModule } from './modules/portal/portal.module';
import { LabsModule } from './modules/labs/labs.module';
import { MastersModule } from './modules/masters/masters.module';
import { CalibrationMastersModule } from './modules/masters/calibration-masters.module';
import { InstrumentImagesModule } from './modules/instruments/instrument-images.module';
import { ComplaintsModule } from './modules/quality/complaints.module';
import { FeedbackModule } from './modules/portal/feedback.module';
import { BackupModule } from './modules/backup/backup.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditPlansModule } from './modules/audit-plans/audit-plans.module';
import { SeedModule } from './modules/seed/seed.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { DeliveryChallansModule } from './modules/delivery-challans/delivery-challans.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CrmActivitiesModule } from './modules/crm-activities/crm-activities.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Serve the built frontend (copied to /app/public in the Docker image).
    // API routes live under /api and are excluded from static handling.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    InstrumentsModule,
    JobsModule,
    DatasheetsModule,
    CertificatesModule,
    EngineersModule,
    TasksModule,
    DashboardModule,
    ReportsModule,
    BillingModule,
    InventoryModule,
    NotificationsModule,
    AuditModule,
    QualityModule,
    EnvironmentalModule,
    PortalModule,
    LabsModule,
    MastersModule,
    CalibrationMastersModule,
    InstrumentImagesModule,
    ComplaintsModule,
    FeedbackModule,
    BackupModule,
    QuotationsModule,
    DocumentsModule,
    AuditPlansModule,
    SeedModule,
    PurchaseOrdersModule,
    DeliveryChallansModule,
    LeadsModule,
    CrmActivitiesModule,
  ],
  providers: [
    // Module 14 — global audit trail for every mutating request.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
