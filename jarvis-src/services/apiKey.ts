/** Runtime Gemini API key: localStorage first, then build-time env. */
const LS = 'GEMINI_API_KEY';
const LS_ALT = 'jarvis_gemini_key';

export function getApiKey(): string {
  try {
    const fromLs = localStorage.getItem(LS) || localStorage.getItem(LS_ALT);
    if (fromLs && fromLs.trim()) return fromLs.trim();
  } catch {
    /* private mode */
  }
  const fromEnv = (process.env.API_KEY || process.env.GEMINI_API_KEY || '') as string;
  return (fromEnv || '').trim();
}

export function setApiKey(key: string): void {
  try {
    if (key && key.trim()) localStorage.setItem(LS, key.trim());
    else {
      localStorage.removeItem(LS);
      localStorage.removeItem(LS_ALT);
    }
  } catch {
    /* */
  }
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey());
}
