import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportResultsCsv(eventId: string) {
    const results = await this.prisma.result.findMany({
      where: { board: { event_id: eventId } },
      include: { board: true, table: true },
    });
    const rows = [
      ['Board', 'Table', 'NS', 'EW', 'Contract', 'Declarer', 'Tricks', 'Score'],
      ...results.map(r => [
        r.board.number,
        r.table_id,
        r.pair_ns,
        r.pair_ew,
        `${r.contract_level ?? 0}${r.strain ?? ''}${r.redoubled ? 'xx' : r.doubled ? 'x' : ''}`,
        r.declarer ?? '',
        r.tricks_made ?? '',
        r.score ?? '',
      ]),
    ];
    return stringify(rows);
  }

  async exportFinalPdf(eventId: string): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
    const buffers: Buffer[] = [];
    doc.on('data', (b) => buffers.push(b));
    const event = await this.prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    doc.fontSize(22).text(`Final Rankings — ${event.name}`);
    doc.moveDown();
    doc.fontSize(12).text('Large-type printable recap.');
    doc.end();
    return await new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
  }
} 