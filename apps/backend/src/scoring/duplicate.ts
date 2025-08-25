export type Strain = 'C' | 'D' | 'H' | 'S' | 'NT';

export function calculateDuplicateScore(options: {
  level: number;
  strain: Strain;
  doubled?: boolean;
  redoubled?: boolean;
  vulnerable: boolean;
  declarerTricks: number; // tricks taken
}): number {
  const { level, strain, doubled, redoubled, vulnerable, declarerTricks } = options;
  const contractTricks = level + 6;
  const diff = declarerTricks - contractTricks;
  const multiplier = redoubled ? 4 : doubled ? 2 : 1;

  const trickValue = strain === 'C' || strain === 'D' ? 20 : strain === 'NT' ? 30 : 30;
  const firstNT = strain === 'NT' ? 10 : 0;

  if (diff < 0) {
    const under = -diff;
    if (!doubled && !redoubled) {
      return -(vulnerable ? 100 * under : 50 * under);
    }
    const scale = vulnerable ? [200, 300, 300] : [100, 200, 300];
    let penalty = 0;
    for (let i = 1; i <= under; i++) {
      if (i === 1) penalty += scale[0];
      else if (i === 2) penalty += scale[1];
      else penalty += scale[2];
    }
    return -penalty * (redoubled ? 2 : 1);
  }

  // made
  const base = level * trickValue + firstNT;
  const baseScore = base * multiplier;
  const partScore = base >= 100 ? (vulnerable ? 500 : 300) : 50;
  const slamBonus = level === 6 ? (vulnerable ? 750 : 500) : level === 7 ? (vulnerable ? 1500 : 1000) : 0;
  const dblBonus = doubled || redoubled ? 50 * (redoubled ? 2 : 1) : 0; // insult

  const over = diff > 0 ? diff : 0;
  let overScore = 0;
  if (!doubled && !redoubled) {
    overScore = over * (strain === 'C' || strain === 'D' ? 20 : 30);
  } else {
    const per = vulnerable ? 200 : 100;
    overScore = over * per * (redoubled ? 2 : 1);
  }

  return baseScore + partScore + slamBonus + dblBonus + overScore;
} 