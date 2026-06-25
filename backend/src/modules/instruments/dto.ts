import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInstrumentDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  name!: string;

  @IsOptional() @IsUUID() disciplineId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() range?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() leastCount?: string;
  @IsOptional() @IsString() idNumber?: string;
  @IsOptional() @IsString() labIdNo?: string;
  @IsOptional() @IsInt() quantity?: number;
  @IsOptional() @IsInt() calibrationIntervalMonths?: number;
  @IsOptional() @IsString() lastCalibrationDate?: string;
}

export class UpdateInstrumentDto {
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsUUID() disciplineId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() range?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() leastCount?: string;
  @IsOptional() @IsString() idNumber?: string;
  @IsOptional() @IsString() labIdNo?: string;
  @IsOptional() @IsInt() quantity?: number;
  @IsOptional() @IsInt() calibrationIntervalMonths?: number;
  @IsOptional() @IsString() lastCalibrationDate?: string;
}
