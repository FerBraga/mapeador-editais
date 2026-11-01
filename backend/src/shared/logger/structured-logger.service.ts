import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

type LogPayload = {
  level: LogLevel;
  timestamp: string;
  context?: string;
  message: unknown;
  trace?: string;
};

@Injectable()
export class StructuredLoggerService implements LoggerService {
  log(message: unknown, context?: string) {
    this.write({ level: 'log', message, context });
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write({ level: 'error', message, context, trace });
  }

  warn(message: unknown, context?: string) {
    this.write({ level: 'warn', message, context });
  }

  debug(message: unknown, context?: string) {
    this.write({ level: 'debug', message, context });
  }

  verbose(message: unknown, context?: string) {
    this.write({ level: 'verbose', message, context });
  }

  private write(entry: Omit<LogPayload, 'timestamp'>) {
    const payload: LogPayload = { ...entry, timestamp: new Date().toISOString() };
    const line = JSON.stringify(payload);
    if (entry.level === 'error') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }
}
