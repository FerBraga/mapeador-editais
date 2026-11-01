import { Controller } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';

@Controller('scrapers')
export class ScrapersController {
  constructor(private readonly scrapersService: ScrapersService) {}
}
