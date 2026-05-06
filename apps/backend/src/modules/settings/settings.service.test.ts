import fs from 'fs';
import os from 'os';
import path from 'path';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let tempDir: string;
  let envFile: string;
  let originalEnvFile: string | undefined;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-settings-'));
    envFile = path.join(tempDir, 'bridge.env');
    originalEnvFile = process.env.BRIDGE_ENV_FILE;
    originalApiKey = process.env.OPENAI_API_KEY;
    process.env.BRIDGE_ENV_FILE = envFile;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalEnvFile === undefined) delete process.env.BRIDGE_ENV_FILE;
    else process.env.BRIDGE_ENV_FILE = originalEnvFile;

    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('saves the OpenAI key permanently without losing existing settings', () => {
    fs.writeFileSync(envFile, 'PORT=4010\nDEVICE_PIN=1234\n');
    const service = new SettingsService();

    const result = service.saveOpenAIKey('  sk-test-grandma-key  ');

    expect(result).toEqual({ configured: true });
    expect(process.env.OPENAI_API_KEY).toBe('sk-test-grandma-key');
    expect(fs.readFileSync(envFile, 'utf8')).toContain('PORT=4010');
    expect(fs.readFileSync(envFile, 'utf8')).toContain('DEVICE_PIN=1234');
    expect(fs.readFileSync(envFile, 'utf8')).toContain('OPENAI_API_KEY=sk-test-grandma-key');
  });

  it('reports whether an OpenAI key is configured without returning the key', () => {
    const service = new SettingsService();

    expect(service.getOpenAIKeyStatus()).toEqual({ configured: false });

    service.saveOpenAIKey('sk-test-grandma-key');

    expect(service.getOpenAIKeyStatus()).toEqual({ configured: true });
  });

  it('removes spaces and line breaks when saving a copied key', () => {
    const service = new SettingsService();

    service.saveOpenAIKey(' sk-test-\n grandma-\r\n key ');

    expect(process.env.OPENAI_API_KEY).toBe('sk-test-grandma-key');
    expect(fs.readFileSync(envFile, 'utf8')).toContain('OPENAI_API_KEY=sk-test-grandma-key');
  });
});
