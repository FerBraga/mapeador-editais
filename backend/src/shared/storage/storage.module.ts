import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalFilesystemStorageService } from './local-filesystem-storage.service';

@Global()
@Module({
  providers: [{ provide: StorageService, useClass: LocalFilesystemStorageService }],
  exports: [StorageService],
})
export class StorageModule {}
