import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ForecastService } from './forecast.service';

@Injectable()
export class ForecastScheduler {
  private readonly logger = new Logger(ForecastScheduler.name);

  constructor(private readonly forecastService: ForecastService) {}

  @Cron('0 2 * * *')
  async generateDailyForecast() {
    this.logger.log('Starting daily forecast generation…');
    try {
      await this.forecastService.saveForecastSnapshot();
      this.logger.log('Daily forecast complete.');
    } catch (err) {
      this.logger.error('Daily forecast failed', err);
    }
  }
}
