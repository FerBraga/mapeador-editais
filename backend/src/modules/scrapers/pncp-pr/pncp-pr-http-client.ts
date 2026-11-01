const MIN_REQUEST_INTERVAL_MS = 500;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_BACKOFF_MS = 3000;

let lastRequestAt = 0;

async function waitForRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  const remaining = MIN_REQUEST_INTERVAL_MS - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  lastRequestAt = Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonOnce<T>(url: string): Promise<{ data: T } | { rateLimited: true }> {
  await waitForRateLimit();

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (response.status === 429) {
    return { rateLimited: true };
  }

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }

  const text = await response.text();
  if (response.status === 204 || text.trim().length === 0) {
    return { data: undefined as T };
  }
  return { data: JSON.parse(text) as T };
}

export async function fetchJson<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await fetchJsonOnce<T>(url);
    if ('data' in result) return result.data;

    if (attempt === MAX_ATTEMPTS) {
      throw new Error(`Request to ${url} kept failing with status 429 after ${MAX_ATTEMPTS} attempts`);
    }
    await sleep(RATE_LIMIT_BACKOFF_MS * attempt);
  }
  throw new Error(`Unreachable: exhausted attempts for ${url}`);
}
