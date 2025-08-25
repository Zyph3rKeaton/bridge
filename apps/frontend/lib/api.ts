export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function fetchJson<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, { cache: 'no-store', ...init });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Request failed ${res.status}: ${text}`);
    }
    return res.json();
  } catch (err) {
    console.error('API request failed:', url, err);
    throw err;
  }
} 