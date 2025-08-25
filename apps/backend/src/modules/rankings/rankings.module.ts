import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [RankingsController],
  providers: [RankingsService, PrismaService],
  exports: [RankingsService],
})
export class RankingsModule {} 