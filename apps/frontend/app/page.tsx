import Link from 'next/link';
import BackendStatus from '../components/BackendStatus';

export default function Home() {
  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-4">
        <img src="/app-logo.png" alt="" width={80} height={80} className="h-20 w-20 rounded-2xl shadow-md" />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">Bridge Scoring</h1>
          <BackendStatus />
        </div>
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
