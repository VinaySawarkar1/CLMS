import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './common/prisma/prisma.module';
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
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
