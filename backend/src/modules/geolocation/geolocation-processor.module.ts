import { Module } from '@nestjs/common';
import { GeolocationModule } from './geolocation.module';
import { GeolocationQueueProcessor } from './geolocation.processor';

@Module({
  imports: [GeolocationModule],
  providers: [GeolocationQueueProcessor],
})
export class GeolocationProcessorModule {}
