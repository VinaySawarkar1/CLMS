import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [PrismaModule],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
