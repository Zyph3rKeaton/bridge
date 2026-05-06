import { Body, Controller, Get, Post } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('openai-key')
  getOpenAIKeyStatus() {
    return this.settings.getOpenAIKeyStatus();
  }

  @Post('openai-key')
  saveOpenAIKey(@Body() body: { apiKey?: string }) {
    return this.settings.saveOpenAIKey(body?.apiKey || '');
  }
}
