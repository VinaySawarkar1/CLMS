import { Module } from '@nestjs/common';
import { DatasheetsService } from './datasheets.service';
import { DatasheetsController } from './datasheets.controller';

@Module({
  controllers: [DatasheetsController],
  providers: [DatasheetsService],
})
export class DatasheetsModule {}
