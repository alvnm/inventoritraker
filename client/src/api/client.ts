const API_BASE = '/api';

const ACCESS_KEY = 'dnd_access';
const REFRESH_KEY = 'dnd_refresh';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshingPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!refresh) return false;
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        setTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshingPromise = null;
      }
    })();
  }
  return refreshingPromise;
}

export async function api<T = any>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; retry?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true, retry = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAccessToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return api<T>(path, { ...options, retry: false });
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    throw new ApiError(res.status, (data as any).error || `Error ${res.status}`);
  }
  return data as T;
}
