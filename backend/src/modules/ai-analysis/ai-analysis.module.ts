import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiAnalysisService } from './ai-analysis.service';
import { AI_ANALYSIS_QUEUE } from './ai-analysis.constants';
import { AI_PROVIDER } from './ai-provider.interface';
import { GeminiProvider } from './gemini-provider';
import { Env } from '../../shared/config/env.schema';
import { GeolocationModule } from '../geolocation/geolocation.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: AI_ANALYSIS_QUEUE }),
    ConfigModule,
    GeolocationModule,
  ],
  controllers: [AiAnalysisController],
  providers: [
    AiAnalysisService,
    GeminiProvider,
    {
      provide: AI_PROVIDER,
      useFactory: (
        config: ConfigService<Env, true>,
        gemini: GeminiProvider,
      ) => {
        const provider = config.get('AI_PROVIDER', { infer: true });
        if (provider === 'gemini') {
          return gemini;
        }
        throw new Error(`AI provider "${provider}" is not implemented yet`);
      },
      inject: [ConfigService, GeminiProvider],
    },
  ],
  exports: [AiAnalysisService, BullModule],
})
export class AiAnalysisModule {}
