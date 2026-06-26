import {
  IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
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

/** One instrument line within a multi-instrument batch intake. */
export class BatchInstrumentDto {
  @IsUUID()
  instrumentId!: string;

  @IsOptional() @IsString() conditionOfItem?: string;
  @IsOptional() @IsString() calibrationProcedure?: string;
  @IsOptional() @IsString() calibrationProcedureNo?: string;
  @IsOptional() @IsString() referenceDocumentNo?: string;
  @IsOptional() @IsString() procedureId?: string;
  @IsOptional() @IsInt() procedureRangeIndex?: number;
  @IsOptional() @IsString() unitOfMeasurement?: string;
  @IsOptional() @IsUUID() masterInstrumentId?: string;
  @IsOptional() @IsString() remarks?: string;
}

/** Create a batch (single customer) with one job per instrument. */
export class CreateJobBatchDto {
  @IsUUID()
  customerId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BatchInstrumentDto)
  instruments!: BatchInstrumentDto[];

  @IsOptional() @IsString() challanNo?: string;
  @IsOptional() @IsString() poNumber?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsBoolean() isOnsite?: boolean;
  @IsOptional() @IsString() siteAddress?: string;
  @IsOptional() @IsString() siteContact?: string;
  @IsOptional() @IsString() visitDate?: string;
}

export class AssignEngineerDto {
  @IsUUID()
  engineerId!: string;
}

export class UpdateStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;
}
