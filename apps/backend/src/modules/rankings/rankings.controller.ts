import { Controller, Get, Param } from '@nestjs/common';
import { RankingsService } from './rankings.service';

@Controller('events/:eventId/rankings')
export class RankingsController {
  constructor(private readonly rankings: RankingsService) {}

  @Get('pairs')
  getPairs(@Param('eventId') eventId: string) {
    return this.rankings.getPairsMatchpoints(eventId);
  }
} 