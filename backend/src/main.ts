import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';

/**
 * Surfaces the real error message on 500s instead of a generic
 * "Internal server error". Logs the full stack server-side and returns the
 * message + error name in the JSON body so failures are diagnosable in the UI.
 */
@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return res.status(status).json(exception.getResponse());
    }

    const err = exception as any;
    this.logger.error(
      `Unhandled error on ${req?.method} ${req?.url}: ${err?.message}`,
      err?.stack,
    );
    return res.status(500).json({
      statusCode: 500,
      message: err?.message ?? 'Internal server error',
      error: err?.name ?? 'InternalServerError',
      // Prisma errors carry a code (e.g. P2002, P2003) — helpful for diagnosis.
      code: err?.code,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Increase body size limit to support base64-encoded file uploads in documents.
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Security headers (helmet-equivalent, no extra package needed)
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self';"
    );
    next();
  });

  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN || true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`CLMS API listening on http://localhost:${port}/api`);
}

bootstrap();
