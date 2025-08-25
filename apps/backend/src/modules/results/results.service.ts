import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { calculateDuplicateScore } from '../../scoring/duplicate';

@Injectable()
export class ResultsService {
  constructor(private prisma: PrismaService) {}

  private normalizeOcrRows(rows: any[]): Array<{
    board_number: number;
    table_number?: number;
    pair_ns: number;
    pair_ew: number;
    contract_level: number;
    strain: 'C' | 'D' | 'H' | 'S' | 'NT';
    doubled?: boolean;
    redoubled?: boolean;
    declarer: 'N' | 'E' | 'S' | 'W';
    tricks_made: number;
  }> {
    const mapStrain = (s: any): 'C' | 'D' | 'H' | 'S' | 'NT' => {
      const x = String(s || '').trim().toLowerCase().replace(/[^a-z]/g, '');
      if (x === 'c' || x.startsWith('club')) return 'C';
      if (x === 'd' || x.startsWith('diamond')) return 'D';
      if (x === 'h' || x.startsWith('heart')) return 'H';
      if (x === 's' || x.startsWith('spade')) return 'S';
      if (x === 'nt' || x === 'notrump' || x === 'ntrump' || x === 'notrumps' || x === 'notrumpes') return 'NT';
      return 'H';
    };
    const mapDecl = (s: any): 'N' | 'E' | 'S' | 'W' => {
      const c = String(s || '').trim().toUpperCase().charAt(0);
      if (c === 'N' || c === 'E' || c === 'S' || c === 'W') return c as any;
      if (c === 'F') return 'S';
      return 'S';
    };
    const parseIntLoose = (v: any): number | null => {
      if (v === null || v === undefined) return null;
      const m = String(v).match(/-?\d+/);
      return m ? parseInt(m[0], 10) : null;
    };

    return rows.map((r) => {
      const level = Math.min(7, Math.max(1, Number(r.contract_level) || 1));
      const strain = mapStrain(r.strain);
      const doubled = !!r.doubled;
      const redoubled = !!r.redoubled;
      const declarer = mapDecl(r.declarer);
      const boardNum = Number(r.board_number) || 1;
      const tableNum = typeof r.table_number === 'number' ? r.table_number : undefined;

      // Derive tricks_made from raw cells if available
      let tricks = Number(r.tricks_made);
      const madeRaw = (r.made_cell ?? '').toString();
      const downRaw = (r.down_cell ?? '').toString();
      const downN = parseIntLoose(downRaw);
      if (Number.isFinite(downN) && downN! >= 0) {
        tricks = level + 6 - (downN as number);
      } else if (madeRaw) {
        const hasEq = madeRaw.includes('=');
        const rawN = parseIntLoose(madeRaw);
        if (hasEq || rawN === level) {
          tricks = level + 6;
        } else if (Number.isFinite(rawN)) {
          const n = rawN as number;
          if (n >= 7 && n <= 13) tricks = n; // absolute trick count
          else if (n < 7) {
            // ambiguous small number: default to contract just made
            tricks = level + 6;
          }
        }
      }
      tricks = Math.max(0, Math.min(13, Math.round(tricks || 0)));

      return {
        board_number: boardNum,
        table_number: tableNum,
        pair_ns: Math.max(1, Number(r.pair_ns) || 1),
        pair_ew: Math.max(1, Number(r.pair_ew) || 1),
        contract_level: level,
        strain,
        doubled,
        redoubled,
        declarer,
        tricks_made: tricks,
      };
    });
  }

  async createDuplicate(input: {
    board_id: string;
    table_id: string;
    pair_ns: number;
    pair_ew: number;
    contract_level: number;
    strain: 'C' | 'D' | 'H' | 'S' | 'NT';
    doubled?: boolean;
    redoubled?: boolean;
    declarer: 'N' | 'E' | 'S' | 'W';
    tricks_made: number;
  }) {
    const board = await this.prisma.board.findUniqueOrThrow({ where: { id: input.board_id } });
    
    // Get or create table
    let table = await this.prisma.table.findFirst({ where: { id: input.table_id } });
    if (!table) {
      // Create a demo table if it doesn't exist
      const section = await this.prisma.section.findFirst({ where: { event_id: board.event_id } });
      if (section) {
        table = await this.prisma.table.create({
          data: { section_id: section.id, number: 1 }
        });
      }
    }
    
    if (!table) {
      throw new Error('Could not find or create table');
    }

    const score = calculateDuplicateScore({
      level: input.contract_level,
      strain: input.strain,
      doubled: input.doubled,
      redoubled: input.redoubled,
      vulnerable: board.vulnerability === 'Both' || (board.vulnerability === 'NS' && (input.declarer === 'N' || input.declarer === 'S')) || (board.vulnerability === 'EW' && (input.declarer === 'E' || input.declarer === 'W')),
      declarerTricks: input.tricks_made,
    });
    
    return this.prisma.result.create({ 
      data: { 
        ...input, 
        table_id: table.id,
        score 
      } 
    });
  }

  async getEventResults(eventId: string) {
    return this.prisma.result.findMany({
      where: {
        board: {
          event_id: eventId
        }
      },
      include: {
        board: {
          select: {
            number: true,
            dealer: true,
            vulnerability: true
          }
        }
      },
      orderBy: [
        { board: { number: 'asc' } },
        { pair_ns: 'asc' }
      ]
    });
  }

  async clearEventResults(eventId: string) {
    const boards = await this.prisma.board.findMany({ where: { event_id: eventId }, select: { id: true } });
    const boardIds = boards.map(b => b.id);
    const res = await this.prisma.result.deleteMany({ where: { board_id: { in: boardIds } } });
    return { ok: true, deleted: res.count };
  }

  async bulkImport(eventId: string, rows: Array<{
    board_number: number;
    table_number?: number;
    pair_ns: number;
    pair_ew: number;
    contract_level: number;
    strain: 'C' | 'D' | 'H' | 'S' | 'NT';
    doubled?: boolean;
    redoubled?: boolean;
    declarer: 'N' | 'E' | 'S' | 'W';
    tricks_made: number;
  }>) {
    const section = await this.prisma.section.findFirst({ where: { event_id: eventId } });
    if (!section) throw new Error('Section not found for event');

    // Ensure a table exists (or create)
    let table = await this.prisma.table.findFirst({ where: { section_id: section.id, number: rows[0]?.table_number || 1 } });
    if (!table) {
      table = await this.prisma.table.create({ data: { section_id: section.id, number: rows[0]?.table_number || 1 } });
    }

    const created: any[] = [];
    for (const r of rows) {
      const board = await this.prisma.board.findFirst({ where: { event_id: eventId, number: r.board_number } });
      if (!board) continue;

      const score = calculateDuplicateScore({
        level: r.contract_level,
        strain: r.strain,
        doubled: r.doubled,
        redoubled: r.redoubled,
        vulnerable: board.vulnerability === 'Both' || (board.vulnerability === 'NS' && (r.declarer === 'N' || r.declarer === 'S')) || (board.vulnerability === 'EW' && (r.declarer === 'E' || r.declarer === 'W')),
        declarerTricks: r.tricks_made,
      });

      const res = await this.prisma.result.create({
        data: {
          board_id: board.id,
          table_id: table.id,
          pair_ns: r.pair_ns,
          pair_ew: r.pair_ew,
          contract_level: r.contract_level,
          strain: r.strain,
          doubled: r.doubled ?? false,
          redoubled: r.redoubled ?? false,
          declarer: r.declarer,
          tricks_made: r.tricks_made,
          score,
        },
      });
      created.push(res);
    }

    return { ok: true, count: created.length };
  }

  async updateResult(id: string, patch: Partial<{
    pair_ns: number;
    pair_ew: number;
    contract_level: number;
    strain: 'C' | 'D' | 'H' | 'S' | 'NT';
    doubled: boolean;
    redoubled: boolean;
    declarer: 'N' | 'E' | 'S' | 'W';
    tricks_made: number;
  }>) {
    const existing = await this.prisma.result.findUnique({ where: { id } });
    if (!existing) throw new Error('Result not found');
    const board = await this.prisma.board.findUniqueOrThrow({ where: { id: existing.board_id } });
    const merged = {
      pair_ns: patch.pair_ns ?? existing.pair_ns,
      pair_ew: patch.pair_ew ?? existing.pair_ew,
      contract_level: patch.contract_level ?? existing.contract_level,
      strain: (patch.strain as any) ?? existing.strain,
      doubled: patch.doubled ?? existing.doubled,
      redoubled: patch.redoubled ?? existing.redoubled,
      declarer: (patch.declarer as any) ?? existing.declarer,
      tricks_made: patch.tricks_made ?? existing.tricks_made,
    } as const;
    const score = calculateDuplicateScore({
      level: merged.contract_level,
      strain: merged.strain,
      doubled: merged.doubled,
      redoubled: merged.redoubled,
      vulnerable: board.vulnerability === 'Both' || (board.vulnerability === 'NS' && (merged.declarer === 'N' || merged.declarer === 'S')) || (board.vulnerability === 'EW' && (merged.declarer === 'E' || merged.declarer === 'W')),
      declarerTricks: merged.tricks_made,
    });
    return this.prisma.result.update({
      where: { id },
      data: { ...merged, score },
    });
  }

  async deleteResult(id: string) {
    await this.prisma.result.delete({ where: { id } });
    return { ok: true };
  }

  async parseImageWithOpenAI(dataUrl: string): Promise<Array<{
    board_number: number;
    table_number?: number;
    pair_ns: number;
    pair_ew: number;
    contract_level: number;
    strain: 'C' | 'D' | 'H' | 'S' | 'NT';
    doubled?: boolean;
    redoubled?: boolean;
    declarer: 'N' | 'E' | 'S' | 'W';
    tricks_made: number;
  }>> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');

    const schema = {
      name: 'duplicate_rows',
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                board_number: { type: 'integer', minimum: 1 },
                table_number: { type: 'integer' },
                pair_ns: { type: 'integer', minimum: 1 },
                pair_ew: { type: 'integer', minimum: 1 },
                contract_level: { type: 'integer', minimum: 1, maximum: 7 },
                strain: { type: 'string', enum: ['C','D','H','S','NT'] },
                doubled: { type: 'boolean' },
                redoubled: { type: 'boolean' },
                declarer: { type: 'string', enum: ['N','E','S','W'] },
                tricks_made: { type: 'integer', minimum: 0, maximum: 13 },
                made_cell: { type: 'string' },
                down_cell: { type: 'string' }
              },
              required: ['board_number','pair_ns','pair_ew','contract_level','strain','declarer']
            }
          }
        },
        required: ['rows']
      }
    } as const;

    const systemPrompt =
      'You are an expert at digitizing duplicate bridge scoresheets. Output strictly JSON per the provided schema.' +
      ' For each row, normalize: strain to C/D/H/S/NT; declarer to N/E/S/W; doubled/redoubled booleans (never both true).' +
      ' For Made/Down interpretation: If Down shows a number X, set tricks_made = contract_level+6-X. If Made shows "=", set tricks_made = contract_level+6.' +
      ' If Made shows a single digit 1-7 equal to contract_level, treat that as exactly made (contract_level+6).' +
      ' If Made shows a number between 7 and 13, treat that as the absolute number of tricks taken.' +
      ' If Made shows +X, set tricks_made = contract_level+6+X.' +
      ' tricks_made must be 0-13.' +
      ' Use common layouts: columns like Board, N-S, E-W, Contract, Dbl, Rdbl, By, Made/Down.' +
      ' IMPORTANT: Detect the sheet header board number (e.g., "BOARD # 2", "Board 2", or similar) and set board_number for every row to that value.' +
      ' Also return the raw cell contents as made_cell and down_cell for each row.' +
      ' Assume standard dealer rotation by board number (1:N, 2:E, 3:S, 4:W then repeat) only for disambiguation; do not output dealer.';

    const callModel = async (model: string) => {
      const body = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Parse this scoresheet image into structured duplicate results (rows array). Return only JSON.' },
              { type: 'image_url', image_url: { url: dataUrl} }
            ]
          }
        ],
        temperature: 0,
        response_format: { type: 'json_schema', json_schema: schema }
      } as any;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('not_ok');
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || '{}';
      try {
        const parsed = JSON.parse(content);
        const rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
        return this.normalizeOcrRows(rows);
      } catch {
        try {
          const arr = JSON.parse(content);
          const rows = Array.isArray(arr) ? arr : [];
          return this.normalizeOcrRows(rows);
        } catch {
          return [];
        }
      }
    };

    const preferred = process.env.OPENAI_OCR_MODEL || 'gpt-4o';
    const candidates = Array.from(new Set([preferred, 'gpt-4o', 'gpt-4o-mini']));
    for (const m of candidates) {
      try {
        const rows = await callModel(m);
        if (rows.length) return rows;
      } catch (_) {
        // try next
      }
    }
    throw new Error('OpenAI OCR failed');
  }

  async parseCornersWithOpenAI(dataUrl: string): Promise<{
    top_left: { x: number; y: number };
    top_right: { x: number; y: number };
    bottom_right: { x: number; y: number };
    bottom_left: { x: number; y: number };
  } | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    const schema = {
      name: 'quad_corners',
      schema: {
        type: 'object',
        properties: {
          top_left: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x','y'] },
          top_right: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x','y'] },
          bottom_right: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x','y'] },
          bottom_left: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x','y'] }
        },
        required: ['top_left','top_right','bottom_right','bottom_left']
      }
    } as const;
    const body = {
      model: process.env.OPENAI_OCR_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You locate document corners. Return the four corners (clockwise starting from top-left) of the inner scoring board rectangle in the image.' },
        { role: 'user', content: [ { type: 'text', text: 'Return quad corners JSON only.' }, { type: 'image_url', image_url: { url: dataUrl } } ] }
      ],
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: schema }
    } as any;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    try {
      const parsed = JSON.parse(content);
      const tl = parsed?.top_left, tr = parsed?.top_right, br = parsed?.bottom_right, bl = parsed?.bottom_left;
      if (tl && tr && br && bl) return { top_left: tl, top_right: tr, bottom_right: br, bottom_left: bl };
      return null;
    } catch {
      return null;
    }
  }
} 