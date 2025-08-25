import { Controller, Get, Param, Res } from '@nestjs/common';
import { ExportsService } from './exports.service';
import type { Response } from 'express';

@Controller('events/:eventId/exports')
export class ExportsController {
  constructor(private readonly exportsSvc: ExportsService) {}

  @Get('csv')
  async csv(@Param('eventId') eventId: string, @Res() res: Response) {
    const csv = await this.exportsSvc.exportResultsCsv(eventId);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  }

  @Get('pdf')
  async pdf(@Param('eventId') eventId: string, @Res() res: Response) {
    const buf = await this.exportsSvc.exportFinalPdf(eventId);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buf);
  }
} 