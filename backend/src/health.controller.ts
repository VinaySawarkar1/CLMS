import { Controller, Get } from '@nestjs/common';

/** Lightweight, unauthenticated liveness probe used by hosting health checks. */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'clms-backend', time: new Date().toISOString() };
  }
}
