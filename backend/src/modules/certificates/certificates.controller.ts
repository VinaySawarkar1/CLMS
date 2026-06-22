import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CertificateType, Role, SignatureStage } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('generate')
  @Roles(Role.SUPER_ADMIN, Role.QUALITY_MANAGER, Role.TECHNICAL_MANAGER)
  generate(
    @Body('jobId') jobId: string,
    @Body('type') type: CertificateType,
    @Body('decisionRule') decisionRule?: string,
  ) {
    return this.certificates.generate(jobId, type ?? 'NABL', decisionRule);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/sign')
  @Roles(
    Role.SUPER_ADMIN,
    Role.CALIBRATION_ENGINEER,
    Role.REVIEWER,
    Role.TECHNICAL_MANAGER,
    Role.QUALITY_MANAGER,
  )
  sign(
    @Param('id') id: string,
    @Body('stage') stage: SignatureStage,
    @Request() req: any,
  ) {
    return this.certificates.sign(id, stage, req.user.id, req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificates.findOne(id);
  }

  /** Public certificate verification endpoint (no auth — for QR scans). */
  @Get(':id/verify')
  verify(@Param('id') id: string) {
    return this.certificates.verify(id);
  }
}
