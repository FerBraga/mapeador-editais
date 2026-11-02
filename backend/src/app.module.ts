import { Module } from '@nestjs/common';
import { AppConfigModule } from './shared/config/app-config.module';
import { AppLoggerModule } from './shared/logger/logger.module';
import { DatabaseModule } from './shared/database/database.module';
import { QueueModule } from './shared/queue/queue.module';
import { StorageModule } from './shared/storage/storage.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SourcesModule } from './modules/sources/sources.module';
import { ScrapersModule } from './modules/scrapers/scrapers.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AiAnalysisModule } from './modules/ai-analysis/ai-analysis.module';
import { GeolocationModule } from './modules/geolocation/geolocation.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MunicipalitiesModule } from './modules/municipalities/municipalities.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    DatabaseModule,
    QueueModule,
    StorageModule,
    AuthModule,
    UsersModule,
    SourcesModule,
    ScrapersModule,
    OpportunitiesModule,
    DocumentsModule,
    AiAnalysisModule,
    GeolocationModule,
    CategoriesModule,
    MunicipalitiesModule,
    AlertsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
