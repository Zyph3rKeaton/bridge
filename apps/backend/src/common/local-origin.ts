export function isAllowedLocalOrigin(origin?: string) {
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}
