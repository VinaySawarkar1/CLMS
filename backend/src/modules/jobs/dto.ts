import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { JobStatus } from '@prisma/client';

export class CreateJobDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  instrumentId!: string;

  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class AssignEngineerDto {
  @IsUUID()
  engineerId!: string;
}

export class UpdateStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;
}
