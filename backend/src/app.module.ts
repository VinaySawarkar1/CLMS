import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
