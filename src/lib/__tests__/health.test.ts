import { checkBackend } from '../health';

const URL = 'https://example.supabase.co';
const KEY = 'anon-key';

function fakeFetch(statusByPath: Record<string, number | 'throw'>) {
  const calls: string[] = [];
  const impl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const path = url.slice(URL.length).split('?')[0];
    const status = statusByPath[path];
    if (status === undefined || status === 'throw') throw new TypeError('fetch failed');
    return { status } as Response;
  }) as typeof fetch;
  return { impl, calls };
}

describe('checkBackend', () => {
  it('is healthy when auth answers 200 and PostgREST answers', async () => {
    const { impl } = fakeFetch({ '/auth/v1/health': 200, '/rest/v1/profiles': 200 });
    await expect(checkBackend(URL, KEY, impl)).resolves.toEqual({ auth: true, db: true });
  });

  it('treats a permission error from Postgres as reachable', async () => {
    const { impl } = fakeFetch({ '/auth/v1/health': 200, '/rest/v1/profiles': 401 });
    await expect(checkBackend(URL, KEY, impl)).resolves.toEqual({ auth: true, db: true });
  });

  it('reports a paused project (DNS failure) as down', async () => {
    const { impl } = fakeFetch({ '/auth/v1/health': 'throw', '/rest/v1/profiles': 'throw' });
    await expect(checkBackend(URL, KEY, impl)).resolves.toEqual({ auth: false, db: false });
  });

  it('reports server errors as down', async () => {
    const { impl } = fakeFetch({ '/auth/v1/health': 503, '/rest/v1/profiles': 500 });
    await expect(checkBackend(URL, KEY, impl)).resolves.toEqual({ auth: false, db: false });
  });

  it('is down without configuration and makes no requests', async () => {
    const { impl, calls } = fakeFetch({});
    await expect(checkBackend(undefined, KEY, impl)).resolves.toEqual({ auth: false, db: false });
    await expect(checkBackend(URL, '', impl)).resolves.toEqual({ auth: false, db: false });
    expect(calls).toHaveLength(0);
  });
});
