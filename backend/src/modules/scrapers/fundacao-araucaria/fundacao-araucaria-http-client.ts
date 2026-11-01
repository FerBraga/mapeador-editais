const USER_AGENT =
  'MapeadorEditaisParanaBot/0.1 (+https://github.com/FerBraga/mapeador-editais)';
const MIN_REQUEST_INTERVAL_MS = 1500;

let lastRequestAt = 0;

async function waitForRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  const remaining = MIN_REQUEST_INTERVAL_MS - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  lastRequestAt = Date.now();
}

export async function fetchHtml(url: string): Promise<string> {
  await waitForRateLimit();

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }

  return response.text();
}
