'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '../../lib/api';

const inputClass = 'rounded-lg border border-slate-300 bg-white p-3 text-lg text-slate-950 placeholder:text-slate-500 caret-slate-950 shadow-sm [color-scheme:light] focus:border-[hsl(42_95%_52%)] focus:outline-none focus:ring-2 focus:ring-[hsl(42_95%_52%)]';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const status = await fetchJson<{ configured: boolean }>('/api/settings/openai-key');
        setConfigured(status.configured);
      } catch (_) {
        setMessage('Settings are not available. Close the app and open it again.');
      }
    })();
  }, []);

  const saveKey = async () => {
    setSaving(true);
    setMessage('');
    try {
      const result = await fetchJson<{ configured: boolean }>('/api/settings/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      setConfigured(result.configured);
      setApiKey('');
      setMessage('Saved. Photo AI is ready.');
    } catch (_) {
      setMessage('That key did not save. Check that it starts with sk- and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="mt-6 grid gap-5">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="text-xl font-semibold">Photo AI</div>
          <div className="mt-2 text-lg">
            {configured ? 'An OpenAI key is saved on this computer.' : 'Paste the OpenAI key one time to turn on Photo AI.'}
          </div>
        </div>

        <label className="grid gap-2 text-lg">
          <span>OpenAI Key</span>
          <input
            className={inputClass}
            type="password"
            value={apiKey}
            placeholder="Paste the key here"
            autoComplete="off"
            onChange={(event) => setApiKey(event.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={saveKey}
          disabled={saving || !apiKey.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-[hsl(185_72%_35%)] px-6 py-4 text-white text-xl disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Key'}
        </button>

        {message && <div className="text-lg font-semibold">{message}</div>}
      </div>
    </div>
  );
}
