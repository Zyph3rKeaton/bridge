import { calculateDuplicateScore } from './duplicate';

describe('calculateDuplicateScore', () => {
  it('partscore undoubled nonvul with overtricks', () => {
    const s = calculateDuplicateScore({ level: 2, strain: 'H', vulnerable: false, declarerTricks: 10 });
    // 2H=2*30=60, partscore 50, 2 over *30 = 60 => 170
    expect(s).toBe(170);
  });

  it('game in NT vulnerable', () => {
    const s = calculateDuplicateScore({ level: 3, strain: 'NT', vulnerable: true, declarerTricks: 9 });
    // base 3NT: 3*30 + 10 = 100, vulnerable game bonus 500 => 600
    expect(s).toBe(600);
  });

  it('doubled overtricks nonvul', () => {
    const s = calculateDuplicateScore({ level: 2, strain: 'S', vulnerable: false, doubled: true, declarerTricks: 9 });
    // base 2S=60*2=120, partscore 50, insult 50, 1 over *100 = 100 => 320
    expect(s).toBe(320);
  });

  it('down vulnerable doubled', () => {
    const s = calculateDuplicateScore({ level: 3, strain: 'D', vulnerable: true, doubled: true, declarerTricks: 7 });
    // down 2: 200 + 300 = 500
    expect(s).toBe(-500);
  });
}); 