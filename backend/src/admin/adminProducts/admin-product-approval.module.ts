import { Module } from '@nestjs/common';
import { AdminProductApprovalController } from './admin-product-approval.controller.js';
import { AdminProductApprovalService } from './admin-product-approval.service.js';
import { FirebaseModule } from '../../shared/firebase/firebase.module.js';
import { CountersModule } from '../../shared/counters/counters.module.js';
import { MailModule } from '../../shared/mail/mail.module.js';

@Module({
  imports: [FirebaseModule, CountersModule, MailModule],
  controllers: [AdminProductApprovalController],
  providers: [AdminProductApprovalService],
  exports: [AdminProductApprovalService],
})
export class AdminProductApprovalModule {}
