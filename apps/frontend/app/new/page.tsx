'use client';
import { useState } from 'react';

export default function NewSessionPage() {
  const [name, setName] = useState('Club Pairs');
  const [boards, setBoards] = useState(24);
  const [rounds, setRounds] = useState(8);
  const [bpr, setBpr] = useState(3);

  const create = async () => {
    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type: 'duplicate_pairs', boards_total: boards, rounds, boards_per_round: bpr }),
    });
    const data = await res.json();
    alert('Created session: ' + data.event.name);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">New Session</h1>
      <div className="mt-6 grid gap-4 max-w-md">
        <label className="grid gap-2 text-lg">
          <span>Name</span>
          <input className="rounded-lg p-3 text-lg" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label className="grid gap-2 text-lg">
          <span>Boards total</span>
          <input className="rounded-lg p-3 text-lg" type="number" value={boards} onChange={e => setBoards(parseInt(e.target.value || '0'))} />
        </label>
        <label className="grid gap-2 text-lg">
          <span>Rounds</span>
          <input className="rounded-lg p-3 text-lg" type="number" value={rounds} onChange={e => setRounds(parseInt(e.target.value || '0'))} />
        </label>
        <label className="grid gap-2 text-lg">
          <span>Boards per round</span>
          <input className="rounded-lg p-3 text-lg" type="number" value={bpr} onChange={e => setBpr(parseInt(e.target.value || '0'))} />
        </label>
        <button className="inline-flex items-center justify-center rounded-lg bg-[hsl(185_72%_35%)] px-6 py-4 text-white text-xl" onClick={create}>
          Create Session
        </button>
      </div>
    </div>
  );
} 