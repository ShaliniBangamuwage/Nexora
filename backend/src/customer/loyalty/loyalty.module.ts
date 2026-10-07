import { Module } from '@nestjs/common';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { AIService } from './ai.service';
import { FirebaseModule } from '../../shared/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, AIService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
