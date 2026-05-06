import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import SettingsPage from '../app/settings/page';

describe('SettingsPage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ configured: false }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('saves a pasted OpenAI key for future app launches', async () => {
    render(React.createElement(SettingsPage));

    const input = await screen.findByLabelText('OpenAI Key');
    fireEvent.change(input, { target: { value: 'sk-test-grandma-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Key' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        'http://localhost:4000/api/settings/openai-key',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ apiKey: 'sk-test-grandma-key' }),
        })
      );
    });
    expect(await screen.findByText('Saved. Photo AI is ready.')).toBeInTheDocument();
  });
});
