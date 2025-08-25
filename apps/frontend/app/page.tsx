import Link from 'next/link';

async function getHealth() {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    const res = await fetch(`${base}/api/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('bad');
    const data = await res.json();
    return data?.status === 'ok' ? 'online' : 'degraded';
  } catch (_) {
    return 'offline';
  }
}

export default async function Home() {
  const status = await getHealth();
  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold">Bridge Scoring</h1>
        <span className={`text-sm px-2 py-1 rounded ${status === 'online' ? 'bg-green-100 text-green-800' : status === 'offline' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
          Backend: {status}
        </span>
      </div>
      <p className="mt-4 text-lg">Start a new session or resume an existing one.</p>
      <div className="mt-6 flex gap-4 flex-wrap">
        <Link className="inline-flex items-center justify-center rounded-lg bg-[hsl(185_72%_35%)] px-6 py-4 text-white text-xl" href="/new">New Session</Link>
        <Link className="inline-flex items-center justify-center rounded-lg bg-[hsl(42_95%_52%)] px-6 py-4 text-white text-xl" href="/events">Events</Link>
        <Link className="inline-flex items-center justify-center rounded-lg bg-[hsl(145_65%_32%)] px-6 py-4 text-white text-xl" href="/board-entry">Board Entry</Link>
        <Link className="inline-flex items-center justify-center rounded-lg bg-[hsl(350_70%_40%)] px-6 py-4 text-white text-xl" href="/results">Results</Link>
        <Link className="inline-flex items-center justify-center rounded-lg bg-[hsl(200_80%_35%)] px-6 py-4 text-white text-xl" href="/scan">Scan</Link>
      </div>
    </div>
  );
} 