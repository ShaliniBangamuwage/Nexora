import { Module } from '@nestjs/common';
import { ForecastController } from './forecast.controller.js';
import { ForecastService } from './forecast.service.js';
import { ForecastScheduler } from './forecast.scheduler.js';
import { FirebaseModule } from '../../shared/firebase/firebase.module.js';

@Module({
  imports: [FirebaseModule], // injects your existing FirebaseService
  controllers: [ForecastController],
  providers: [ForecastService, ForecastScheduler],
  exports: [ForecastService],
})
export class ForecastModule {}
