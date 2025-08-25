import { Controller, Get, Param } from '@nestjs/common';
import { BoardsService } from './boards.service';

@Controller('events/:eventId/boards')
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Get()
  list(@Param('eventId') eventId: string) {
    return this.boards.listByEvent(eventId);
  }
} 