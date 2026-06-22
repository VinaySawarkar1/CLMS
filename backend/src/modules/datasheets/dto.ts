import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ObservationDto {
  @IsOptional() @IsString() pointLabel?: string;
  @IsOptional() @IsNumber() nominal?: number;
  @IsOptional() @IsNumber() standardValue?: number;
  @IsOptional() @IsNumber() observedValue?: number;
  @IsOptional() @IsObject() data?: Record<string, unknown>;
}

export class CreateDatasheetDto {
  @IsUUID()
  jobId!: string;

  @IsString()
  templateName!: string;

  @IsOptional() @IsObject() environmental?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObservationDto)
  observations?: ObservationDto[];
}

export class RecalcDto {
  /**
   * Per-column formulas keyed by the observation field they populate.
   * Variables available: nominal, standardValue, observedValue.
   * Example: { "correction": "standardValue - observedValue" }
   */
  @IsObject()
  formulas!: Record<string, string>;
}
