import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GeolocationController } from './geolocation.controller';
import { GeolocationService } from './geolocation.service';
import { MunicipalityMatcherService } from './municipality-matcher.service';
import { GEOLOCATION_QUEUE } from './geolocation.constants';

@Module({
  imports: [BullModule.registerQueue({ name: GEOLOCATION_QUEUE })],
  controllers: [GeolocationController],
  providers: [GeolocationService, MunicipalityMatcherService],
  exports: [GeolocationService, BullModule],
})
export class GeolocationModule {}
