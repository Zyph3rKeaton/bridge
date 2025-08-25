import { parseDuplicateOCRText } from '../lib/ocr/duplicateParser';

describe('parseDuplicateOCRText', () => {
  it('parses simple contract with equals notation', () => {
    const input = 'Board 1  NS:1  EW:2  4 H by S =';
    const rows = parseDuplicateOCRText(input);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.board_number).toBe(1);
    expect(r.pair_ns).toBe(1);
    expect(r.pair_ew).toBe(2);
    expect(r.contract_level).toBe(4);
    expect(r.strain).toBe('H');
    expect(r.declarer).toBe('S');
    expect(r.tricks_made).toBe(10);
  });

  it('parses NT with + overtricks', () => {
    const input = 'Board 3 NS:3 EW:4 3 NT by N +2';
    const [r] = parseDuplicateOCRText(input);
    expect(r.contract_level).toBe(3);
    expect(r.strain).toBe('NT');
    expect(r.declarer).toBe('N');
    expect(r.tricks_made).toBe(11);
  });

  it('parses down tricks with minus', () => {
    const input = '2  NS:5  EW:6  2 S by E -1';
    const [r] = parseDuplicateOCRText(input);
    expect(r.board_number).toBe(2);
    expect(r.contract_level).toBe(2);
    expect(r.strain).toBe('S');
    expect(r.declarer).toBe('E');
    expect(r.tricks_made).toBe(7); // 2+6-1
  });

  it('parses doubled and redoubled', () => {
    const input = 'Board 4 NS:1 EW:2 4 H Dbl by S =';
    const [r1] = parseDuplicateOCRText(input);
    expect(r1.doubled).toBe(true);
    expect(r1.redoubled).toBe(false);
    const input2 = 'Board 5 NS:1 EW:2 2 D Rdbl by W +1';
    const [r2] = parseDuplicateOCRText(input2);
    expect(r2.doubled).toBe(false);
    expect(r2.redoubled).toBe(true);
  });

  it('parses absolute tricks notation', () => {
    const input = 'Board 6 NS:7 EW:8 1 C by N 8 tricks';
    const [r] = parseDuplicateOCRText(input);
    expect(r.tricks_made).toBe(8);
  });
}); 