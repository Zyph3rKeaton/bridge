import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  listByEvent(eventId: string) {
    return this.prisma.board.findMany({ where: { event_id: eventId }, orderBy: { number: 'asc' } });
  }
} 