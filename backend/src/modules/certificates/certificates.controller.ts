import {
  Body, Controller, Get, Param, Post, Query, Request, UseGuards,
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
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  generate(
    @Request() req: any,
    @Body('jobId') jobId: string,
    @Body('type') type: CertificateType,
    @Body('decisionRule') decisionRule?: string,
  ) {
    return this.certificates.generate(jobId, req.user.labId, type ?? 'NABL', decisionRule);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/sign')
  @Roles(
    Role.LAB_ADMIN, Role.CALIBRATION_ENGINEER, Role.TECHNICAL_MANAGER,
  )
  sign(
    @Param('id') id: string,
    @Body('stage') stage: SignatureStage,
    @Request() req: any,
  ) {
    return this.certificates.sign(id, stage, req.user.id, req.user.email);
  }

  /** Create a new revision of a finalised certificate. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/revise')
  @Roles(Role.LAB_ADMIN, Role.TECHNICAL_MANAGER)
  revise(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.certificates.createRevision(id, req.user.labId, reason);
  }

  /** Full revision history for a certificate. */
  @UseGuards(JwtAuthGuard)
  @Get(':id/revisions')
  revisions(@Param('id') id: string) {
    return this.certificates.getRevisions(id);
  }

  /** Public lookup by certificate number or job number (no auth). */
  @Get('lookup')
  lookup(@Query('q') q: string) {
    return this.certificates.lookup(q);
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
