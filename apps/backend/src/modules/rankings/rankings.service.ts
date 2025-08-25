import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async getPairsMatchpoints(eventId: string) {
    // Simple MP calc across all boards in event, per section A only for now
    const boards = await this.prisma.board.findMany({ where: { event_id: eventId }, select: { id: true } });
    const boardIds = boards.map(b => b.id);
    const results = await this.prisma.result.findMany({ where: { board_id: { in: boardIds } } });

    const pairToMp = new Map<number, number>();

    // group by board
    const byBoard = new Map<string, typeof results>();
    for (const r of results) {
      const arr = byBoard.get(r.board_id) ?? [];
      arr.push(r);
      byBoard.set(r.board_id, arr);
    }

    for (const [, group] of byBoard) {
      const sorted = [...group].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const n = sorted.length;
      const top = n - 1; // 1-point scale
      for (let i = 0; i < sorted.length; i++) {
        const mp = top - i; // ignore ties for simplicity
        const add = (pair: number, val: number) => pairToMp.set(pair, (pairToMp.get(pair) ?? 0) + val);
        add(sorted[i].pair_ns, mp);
        add(sorted[i].pair_ew, mp);
      }
    }

    const standings = [...pairToMp.entries()].map(([pair, mp]) => ({ pair, mp })).sort((a, b) => b.mp - a.mp);
    return { eventId, standings };
  }
} 