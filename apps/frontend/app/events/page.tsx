'use client';
import { useEffect, useState } from 'react';
import { fetchJson } from '../../lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const ev = await fetchJson<any[]>('/api/events');
        setEvents(ev);
        if (ev[0]) {
          const br = await fetchJson<any[]>(`/api/events/${ev[0].id}/boards`);
          setBoards(br);
        }
      } catch (_) {
        setError('Failed to load events. Is the backend running on http://localhost:4000?');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Events</h1>
        <p className="mt-4" style={{ color: 'var(--error)' }}>{error}</p>
      </div>
    );
  }

  const firstEvent = events[0];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <ul className="mt-4 space-y-3">
        {events.map((e: any) => (
          <li key={e.id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="text-xl">{e.name}</div>
            <div className="text-sm opacity-80">{e.type} • {e.boards_total} boards</div>
          </li>
        ))}
      </ul>

      {firstEvent && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Boards</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {boards.map((b: any) => (
              <div key={b.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <div className="font-semibold">Board {b.number}</div>
                <div className="text-sm opacity-80">{b.dealer} deals • {b.vulnerability}</div>
                <a href={`/scan?board=${encodeURIComponent(b.number)}`} className="inline-flex mt-2 items-center justify-center rounded-lg px-4 py-2 text-sm" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>Scan</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 