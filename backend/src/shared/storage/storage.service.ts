export abstract class StorageService {
  abstract upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  abstract getBuffer(storageKey: string): Promise<Buffer>;
}
