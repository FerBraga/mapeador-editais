import { NestFactory } from '@nestjs/core';
import { Logger, Type } from '@nestjs/common';
import { AppModule } from '../app.module';
import { StructuredLoggerService } from '../shared/logger/structured-logger.service';

export async function bootstrapWorker(workerName: string, rootModule: Type<unknown> = AppModule) {
  const app = await NestFactory.createApplicationContext(rootModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(StructuredLoggerService));

  const logger = new Logger(workerName);
  logger.log(`${workerName} connected to the queue and ready`);

  const shutdown = async () => {
    logger.log(`${workerName} shutting down`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return app;
}
