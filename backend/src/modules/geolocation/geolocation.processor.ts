import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GeolocationService } from './geolocation.service';
import { GEOLOCATION_QUEUE } from './geolocation.constants';

@Processor(GEOLOCATION_QUEUE)
export class GeolocationQueueProcessor extends WorkerHost {
  constructor(private readonly geolocationService: GeolocationService) {
    super();
  }

  async process(job: Job) {
    const { opportunityId } = job.data as { opportunityId: string };
    return this.geolocationService.resolveOpportunity(opportunityId);
  }
}
