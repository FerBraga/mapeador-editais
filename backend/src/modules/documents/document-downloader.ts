import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isAllowedScheme, isPrivateOrReservedIp } from './ssrf-guard';

export type DownloadResult = {
  buffer: Buffer;
  checksum: string;
  contentType: string | null;
};

export class DownloadError extends Error {}

const USER_AGENT = 'MapeadorEditaisParanaBot/0.1 (+https://github.com/FerBraga/mapeador-editais)';

export async function downloadDocument(
  sourceUrl: string,
  options: { maxBytes: number; timeoutMs: number },
): Promise<DownloadResult> {
  const url = new URL(sourceUrl);
  if (!isAllowedScheme(url)) {
    throw new DownloadError(`Unsupported URL scheme "${url.protocol}"`);
  }

  const resolved = await lookup(url.hostname).catch(() => {
    throw new DownloadError(`Could not resolve hostname "${url.hostname}"`);
  });
  if (isPrivateOrReservedIp(resolved.address, resolved.family as 4 | 6)) {
    throw new DownloadError(`Refusing to fetch from private/reserved address for "${url.hostname}"`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      throw new DownloadError(`Request failed with status ${response.status}`);
    }
    if (!response.body) {
      throw new DownloadError('Response had no body');
    }

    const hash = createHash('sha256');
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      totalBytes += chunk.length;
      if (totalBytes > options.maxBytes) {
        controller.abort();
        throw new DownloadError(`Response exceeded the maximum allowed size of ${options.maxBytes} bytes`);
      }
      const bufferChunk = Buffer.from(chunk);
      hash.update(bufferChunk);
      chunks.push(bufferChunk);
    }

    return {
      buffer: Buffer.concat(chunks),
      checksum: hash.digest('hex'),
      contentType: response.headers.get('content-type'),
    };
  } catch (error) {
    if (error instanceof DownloadError) throw error;
    if (controller.signal.aborted) {
      throw new DownloadError(`Download aborted (timeout of ${options.timeoutMs}ms or size limit exceeded)`);
    }
    throw new DownloadError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}
