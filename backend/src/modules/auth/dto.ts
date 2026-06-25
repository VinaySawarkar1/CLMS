import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  labId?: string;
}

export class RegisterLabDto {
  // Lab details
  @IsString()
  labName!: string;

  @IsOptional()
  @IsString()
  accreditationNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEmail()
  contactEmail!: string;

  // LAB_ADMIN account
  @IsString()
  adminFullName!: string;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(8)
  adminPassword!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
