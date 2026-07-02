import { Body, Controller, Get, Post, UseGuards, Request, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto, RegisterLabDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LabsService } from '../labs/labs.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly labs: LabsService,
  ) {}

  /** Public: register a new lab + its LAB_ADMIN user */
  @Post('register-lab')
  registerLab(@Body() dto: RegisterLabDto) {
    return this.labs.registerLab(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req: any) {
    return this.auth.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.auth.getMe(req.user.id);
  }
}
