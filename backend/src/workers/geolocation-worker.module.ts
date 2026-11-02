import { Module } from '@nestjs/common';
import { AppModule } from '../app.module';
import { GeolocationProcessorModule } from '../modules/geolocation/geolocation-processor.module';

@Module({
  imports: [AppModule, GeolocationProcessorModule],
})
export class GeolocationWorkerModule {}
