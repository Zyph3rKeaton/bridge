'use client';

import { useEffect, useState } from 'react';

type BackendStatus = 'checking' | 'online' | 'offline' | 'degraded';

const statusClasses: Record<BackendStatus, string> = {
  checking: 'bg-yellow-100 text-yellow-800',
  online: 'bg-green-100 text-green-800',
  offline: 'bg-red-100 text-red-800',
  degraded: 'bg-yellow-100 text-yellow-800',
};

export default function BackendStatus() {
  const [status, setStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3000);
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

    fetch(`${base}/api/health`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          setStatus('degraded');
          return;
        }

        const data = await response.json();
        setStatus(data?.status === 'ok' ? 'online' : 'degraded');
      })
      .catch(() => setStatus('offline'))
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <span className={`text-sm px-2 py-1 rounded ${statusClasses[status]}`}>
      Backend: {status}
    </span>
  );
}
