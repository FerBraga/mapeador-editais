import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { StorageService } from './storage.service';
import { Env } from '../config/env.schema';

@Injectable()
export class LocalFilesystemStorageService extends StorageService {
  private readonly baseDir: string;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.baseDir = resolve(config.get('STORAGE_LOCAL_DIR', { infer: true }));
  }

  async upload(key: string, buffer: Buffer): Promise<string> {
    const storageKey = this.sanitizeKey(key);
    const filePath = join(this.baseDir, storageKey);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    return storageKey;
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    return readFile(join(this.baseDir, this.sanitizeKey(storageKey)));
  }

  // Prevents path traversal: strips any ".." segment and leading slashes from a key derived from untrusted input.
  private sanitizeKey(key: string): string {
    return key
      .split('/')
      .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
      .join('/');
  }
}
