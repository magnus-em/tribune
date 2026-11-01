/**
 * Backend reachability for /api/health. Two cheap requests with the public anon
 * key: Supabase Auth's health endpoint, and a one-row PostgREST read that RLS
 * returns empty for anon. The read reaches Postgres, which also counts as
 * activity, so the daily cron keeps a free-tier project from being paused.
 *
 * A paused or deleted project fails at DNS, so every request throws. Returns
 * booleans only; nothing from a response body is passed on.
 */
export type BackendHealth = { auth: boolean; db: boolean };

export const HEALTH_TIMEOUT_MS = 5000;

export async function checkBackend(
  supabaseUrl: string | undefined,
  anonKey: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<BackendHealth> {
  if (!supabaseUrl || !anonKey) return { auth: false, db: false };
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

  async function reachable(path: string, okIf: (status: number) => boolean) {
    try {
      const res = await fetchImpl(`${supabaseUrl}${path}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });
      return okIf(res.status);
    } catch {
      return false;
    }
  }

  const [auth, db] = await Promise.all([
    reachable("/auth/v1/health", (s) => s >= 200 && s < 300),
    // Below 500 means Postgres answered, even with a permission error.
    reachable("/rest/v1/profiles?select=id&limit=1", (s) => s < 500),
  ]);
  return { auth, db };
}
