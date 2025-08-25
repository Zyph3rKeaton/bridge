import { Body, Controller, Post, Get, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResultsService } from './results.service';
import { Delete } from '@nestjs/common';
import { Patch } from '@nestjs/common';

@Controller('results')
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Post()
  create(@Body() body: any) {
    return this.results.createDuplicate(body);
  }

  @Get('events/:eventId')
  async getEventResults(@Param('eventId') eventId: string) {
    return this.results.getEventResults(eventId);
  }

  @Delete('events/:eventId')
  async clearEventResults(@Param('eventId') eventId: string) {
    return this.results.clearEventResults(eventId);
  }

  @Patch(':id')
  async updateResult(@Param('id') id: string, @Body() body: any) {
    return this.results.updateResult(id, body || {});
  }

  @Delete(':id')
  async deleteResult(@Param('id') id: string) {
    return this.results.deleteResult(id);
  }

  @Post('events/:eventId/bulk')
  async bulkImport(
    @Param('eventId') eventId: string,
    @Body() body: { rows: Array<{
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
    }>; }
  ) {
    return this.results.bulkImport(eventId, body.rows || []);
  }

  @Post('ocr/parse')
  @UseInterceptors(FileInterceptor('file'))
  async ocrParse(@UploadedFile() file: Express.Multer.File) {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const rows = await this.results.parseImageWithOpenAI(base64);
    return { rows };
  }

  @Post('ocr/corners')
  @UseInterceptors(FileInterceptor('file'))
  async detectCorners(@UploadedFile() file: Express.Multer.File) {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const corners = await this.results.parseCornersWithOpenAI(base64);
    return { corners };
  }

  @Post('events/:eventId/ocr/import')
  @UseInterceptors(FileInterceptor('file'))
  async ocrImport(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const rows = await this.results.parseImageWithOpenAI(base64);
    const result = await this.results.bulkImport(eventId, rows);
    return { imported: result.count };
  }
} 