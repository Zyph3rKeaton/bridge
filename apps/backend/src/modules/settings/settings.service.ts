import { BadRequestException, Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

@Injectable()
export class SettingsService {
  getOpenAIKeyStatus() {
    return { configured: Boolean(process.env.OPENAI_API_KEY?.trim()) };
  }

  saveOpenAIKey(rawApiKey: string) {
    const apiKey = String(rawApiKey || '').replace(/\s+/g, '');
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new BadRequestException('OpenAI key must start with sk-');
    }

    const envFile = this.envFilePath();
    fs.mkdirSync(path.dirname(envFile), { recursive: true });

    const lines = fs.existsSync(envFile)
      ? fs.readFileSync(envFile, 'utf8').split(/\r?\n/)
      : [];
    const nextLines: string[] = [];
    let wroteKey = false;

    for (const line of lines) {
      if (!line) {
        nextLines.push(line);
        continue;
      }

      const key = line.split('=', 1)[0]?.trim();
      if (key === 'OPENAI_API_KEY') {
        if (!wroteKey) {
          nextLines.push(`OPENAI_API_KEY=${apiKey}`);
          wroteKey = true;
        }
        continue;
      }

      nextLines.push(line);
    }

    if (!wroteKey) {
      nextLines.push(`OPENAI_API_KEY=${apiKey}`);
    }

    fs.writeFileSync(envFile, this.normalizeEnvFile(nextLines), { encoding: 'utf8' });
    process.env.OPENAI_API_KEY = apiKey;

    return { configured: true };
  }

  private envFilePath() {
    return process.env.BRIDGE_ENV_FILE || path.join(process.cwd(), 'bridge.env');
  }

  private normalizeEnvFile(lines: string[]) {
    return `${lines.filter((line, index) => line || index < lines.length - 1).join('\n')}\n`;
  }
}
