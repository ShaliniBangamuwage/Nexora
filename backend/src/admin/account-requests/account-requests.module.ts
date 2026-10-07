import { Module } from '@nestjs/common';
import { AccountRequestsController } from './account-requests.controller.js';
import { AccountRequestsService } from './account-requests.service.js';
import { FirebaseModule } from '../../shared/firebase/firebase.module.js';
import { MailModule } from '../../shared/mail/mail.module.js';

@Module({
  imports: [FirebaseModule, MailModule],
  controllers: [AccountRequestsController],
  providers: [AccountRequestsService],
})
export class AccountRequestsModule {}
