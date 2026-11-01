import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/exceptions/all-exceptions.filter';
import { StructuredLoggerService } from './shared/logger/structured-logger.service';
import { Env } from './shared/config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(StructuredLoggerService));

  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }).split(',').map((o) => o.trim()),
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mapa Inteligente de Editais do Paraná')
    .setDescription('API do MVP de descoberta e interpretação de editais de fomento no Paraná')
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}
bootstrap();
