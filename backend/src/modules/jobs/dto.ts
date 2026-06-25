import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { JobStatus } from '@prisma/client';

export class CreateJobDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  instrumentId!: string;

  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsString() challanNo?: string;
  @IsOptional() @IsString() poNumber?: string;
  @IsOptional() @IsString() conditionOfItem?: string;
  @IsOptional() @IsString() calibrationProcedureNo?: string;
  @IsOptional() @IsString() referenceDocumentNo?: string;
  @IsOptional() @IsString() calibrationProcedure?: string;
  @IsOptional() @IsBoolean() isOnsite?: boolean;
  @IsOptional() @IsString() siteAddress?: string;
  @IsOptional() @IsString() siteContact?: string;
  @IsOptional() @IsString() visitDate?: string;
  // Calibration procedure locked at job creation
  @IsOptional() @IsString() procedureId?: string;
  @IsOptional() @IsInt() procedureRangeIndex?: number;
  @IsOptional() @IsString() unitOfMeasurement?: string;
  // Master/reference instrument selected at job creation
  @IsOptional() @IsUUID() masterInstrumentId?: string;
}

export class AssignEngineerDto {
  @IsUUID()
  engineerId!: string;
}

export class UpdateStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;
}
