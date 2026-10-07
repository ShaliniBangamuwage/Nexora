import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoyaltyService } from './customer/loyalty/loyalty.service';

async function bootstrap() {
  console.log('Starting sync script...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const loyaltyService = app.get(LoyaltyService);
  
  console.log('Running retroactive sync...');
  const result = await loyaltyService.syncFromOrders();
  console.log('Sync result:', result);
  
  await app.close();
}
bootstrap().catch(console.error);
