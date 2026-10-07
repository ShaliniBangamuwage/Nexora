import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ForecastService } from './forecast.service.js';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('forecast')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get()
  async getForecast() {
    return this.forecastService.getForecast();
  }

  @Get('insight/:productId')
  async getInsight(
    @Param('productId') productId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Prevent browsers/proxies from caching AI insight responses (was causing
    // stale 304s to be served instead of a fresh Groq call).
    res.set('Cache-Control', 'no-store');
    return this.forecastService.getAiInsight(productId);
  }
}
