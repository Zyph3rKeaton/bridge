import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function dealerForBoard(n: number): string {
  const order = ['N','E','S','W'];
  return order[(n - 1) % 4];
}

function vulForBoard(n: number): string {
  const pattern = ['None','NS','EW','Both'];
  return pattern[(n - 1) % 4];
}

async function main() {
  const event = await prisma.event.create({
    data: {
      type: 'duplicate_pairs',
      name: 'Demo Mitchell 24 boards',
      boards_total: 24,
      boards_per_round: 3,
      rounds: 8,
      timer_minutes: 21,
      status: 'running',
    },
  });

  const section = await prisma.section.create({
    data: { event_id: event.id, letter: 'A' },
  });

  // 6 tables for 12 pairs
  const tables = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      prisma.table.create({ data: { section_id: section.id, number: i + 1 } })
    )
  );

  // 12 pairs
  await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      prisma.pair.create({
        data: {
          section_id: section.id,
          number: i + 1,
          north_name: `Pair ${i + 1} N`,
          south_name: `Pair ${i + 1} S`,
        },
      })
    )
  );

  // Movement json (basic Mitchell placeholder)
  await prisma.movement.create({
    data: {
      section_id: section.id,
      type: 'Mitchell',
      json_plan: JSON.stringify({ rounds: 8, tables: 6, boardsPerRound: 3, arrowSwitch: false }),
    },
  });

  // Boards
  await Promise.all(
    Array.from({ length: 24 }, (_, i) =>
      prisma.board.create({
        data: {
          event_id: event.id,
          number: i + 1,
          dealer: dealerForBoard(i + 1),
          vulnerability: vulForBoard(i + 1),
        },
      })
    )
  );

  console.log('Seeded demo event:', event.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
}); 