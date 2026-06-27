import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

enum CustomerStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', BLACKLISTED = 'BLACKLISTED' }

export class CreateCustomerDto {
  @IsString() code!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() customerType?: string;
  @IsOptional() @IsString() gstin?: string;
  @IsOptional() @IsString() pan?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() billingAddress?: string;
  @IsOptional() @IsString() billingCity?: string;
  @IsOptional() @IsString() billingState?: string;
  @IsOptional() @IsString() billingPinCode?: string;
  @IsOptional() @IsString() billingCountry?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsNumber() creditLimit?: number;
  @IsOptional() @IsNumber() creditDays?: number;
  @IsOptional() @IsNumber() openingBalance?: number;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() salesExecutive?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(CustomerStatus) customerStatus?: CustomerStatus;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() customerType?: string;
  @IsOptional() @IsString() gstin?: string;
  @IsOptional() @IsString() pan?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() billingAddress?: string;
  @IsOptional() @IsString() billingCity?: string;
  @IsOptional() @IsString() billingState?: string;
  @IsOptional() @IsString() billingPinCode?: string;
  @IsOptional() @IsString() billingCountry?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsNumber() creditLimit?: number;
  @IsOptional() @IsNumber() creditDays?: number;
  @IsOptional() @IsNumber() openingBalance?: number;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() salesExecutive?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(CustomerStatus) customerStatus?: CustomerStatus;
}
