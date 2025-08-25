import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

function dealerForBoard(n: number): string {
  const order = ['N','E','S','W'];
  return order[(n - 1) % 4];
}
function vulForBoard(n: number): string {
  const pattern = ['None','NS','EW','Both'];
  return pattern[(n - 1) % 4];
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.event.findMany({ orderBy: { start_at: 'desc' } });
  }

  get(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  async create(input: any) {
    const type = input.type ?? 'duplicate_pairs';
    const boards_total = input.boards_total ?? 24;
    const rounds = input.rounds ?? 8;
    const boards_per_round = input.boards_per_round ?? Math.floor(boards_total / rounds);
    const name = input.name ?? 'New Session';

    const event = await this.prisma.event.create({
      data: {
        type,
        name,
        boards_total,
        boards_per_round,
        rounds,
        timer_minutes: input.timer_minutes ?? 20,
        status: 'setup',
      },
    });

    const section = await this.prisma.section.create({ data: { event_id: event.id, letter: 'A' } });

    await Promise.all(
      Array.from({ length: boards_total }, (_, i) =>
        this.prisma.board.create({
          data: {
            event_id: event.id,
            number: i + 1,
            dealer: dealerForBoard(i + 1),
            vulnerability: vulForBoard(i + 1),
          },
        })
      )
    );

    return { event, section };
  }
} 