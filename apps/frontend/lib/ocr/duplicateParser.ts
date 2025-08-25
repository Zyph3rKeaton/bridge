export type Strain = 'C' | 'D' | 'H' | 'S' | 'NT';
export type Seat = 'N' | 'E' | 'S' | 'W';

export interface ParsedDuplicateRow {
  board_number: number;
  table_number?: number;
  pair_ns: number;
  pair_ew: number;
  contract_level: number;
  strain: Strain;
  doubled: boolean;
  redoubled: boolean;
  declarer: Seat;
  tricks_made: number; // absolute tricks taken (0-13)
  // Derived presentation
  made_notation: '=' | `+${number}` | `-${number}`;
}

const normalize = (s: string): string => {
  return s
    .replace(/\u2660|spades?/gi, ' S')
    .replace(/\u2665|hearts?/gi, ' H')
    .replace(/\u2666|diamonds?/gi, ' D')
    .replace(/\u2663|clubs?/gi, ' C')
    .replace(/no\s*trump|no-trump|n\.?t\.?/gi, ' NT')
    // Map full words only to avoid breaking NS/EW tokens
    .replace(/\bNorth\b/gi, ' N')
    .replace(/\bSouth\b/gi, ' S')
    .replace(/\bEast\b/gi, ' E')
    .replace(/\bWest\b/gi, ' W')
    .replace(/\b(redoubled|rdbl)\b/gi, ' Rdbl')
    .replace(/\b(doubled|dbl)\b/gi, ' Dbl')
    .replace(/\s+/g, ' ')
    .trim();
};

function parseContract(line: string): { level: number; strain: Strain } | null {
  const m = line.match(/\b([1-7])\s*(NT|C|D|H|S)\b/i);
  if (!m) return null;
  return { level: parseInt(m[1], 10), strain: m[2].toUpperCase() as Strain };
}

function parsePairs(line: string): { pair_ns: number; pair_ew: number } | null {
  const ns = line.match(/\bNS[:\-\s]+(\d{1,2})\b/i);
  const ew = line.match(/\bEW[:\-\s]+(\d{1,2})\b/i);
  if (!ns || !ew) return null;
  return { pair_ns: parseInt(ns[1], 10), pair_ew: parseInt(ew[1], 10) };
}

function parseBoard(line: string): number | null {
  const b = line.match(/\bBoard\s*(\d{1,2})\b/i) || line.match(/^\s*(\d{1,2})\b/);
  return b ? parseInt(b[1], 10) : null;
}

function parseDeclarer(line: string): Seat | null {
  const m = line.match(/\bby\s*(N|E|S|W)\b/i) || line.match(/\b(N|E|S|W)\b/);
  return m ? (m[1].toUpperCase() as Seat) : null;
}

function parseDoubles(line: string): { doubled: boolean; redoubled: boolean } {
  const redoubled = /\bRdbl\b/i.test(line);
  const doubled = !redoubled && /\bDbl\b/i.test(line);
  return { doubled, redoubled };
}

function parseMade(line: string, level: number): { tricks_made: number; made_notation: ParsedDuplicateRow['made_notation'] } | null {
  if (/=/.test(line)) {
    const tricks = level + 6;
    return { tricks_made: tricks, made_notation: '=' };
  }
  const plus = line.match(/\+(\d{1,2})\b/);
  if (plus) {
    const over = parseInt(plus[1], 10);
    const tricks = level + 6 + over;
    return { tricks_made: tricks, made_notation: (`+${over}` as const) };
  }
  const minus = line.match(/\-(\d{1,2})\b/);
  if (minus) {
    const under = parseInt(minus[1], 10);
    const tricks = Math.max(0, level + 6 - under);
    return { tricks_made: tricks, made_notation: (`-${under}` as const) };
  }
  const abs = line.match(/\b(\d{1,2})\s*tricks?\b/i);
  if (abs) {
    const tricks = Math.min(13, parseInt(abs[1], 10));
    const diff = tricks - (level + 6);
    const made_notation = diff === 0 ? '=' : (diff > 0 ? (`+${diff}` as const) : (`-${-diff}` as const));
    return { tricks_made: tricks, made_notation };
  }
  return null;
}

export function parseDuplicateOCRText(raw: string): ParsedDuplicateRow[] {
  const lines = raw.split(/\n+/).map(x => normalize(x)).filter(Boolean);
  const out: ParsedDuplicateRow[] = [];
  for (const line of lines) {
    const board_number = parseBoard(line);
    const pairs = parsePairs(line);
    const contract = parseContract(line);
    const declarer = parseDeclarer(line);
    if (board_number == null || !pairs || !contract || !declarer) continue;

    const { doubled, redoubled } = parseDoubles(line);
    const made = parseMade(line, contract.level);
    if (!made) continue;

    out.push({
      board_number,
      pair_ns: pairs.pair_ns,
      pair_ew: pairs.pair_ew,
      contract_level: contract.level,
      strain: contract.strain,
      doubled,
      redoubled,
      declarer,
      tricks_made: made.tricks_made,
      made_notation: made.made_notation,
    });
  }
  return out;
} 