import { bootstrapWorker } from './bootstrap-worker';
import { GeolocationWorkerModule } from './geolocation-worker.module';

bootstrapWorker('GeolocationWorker', GeolocationWorkerModule);
