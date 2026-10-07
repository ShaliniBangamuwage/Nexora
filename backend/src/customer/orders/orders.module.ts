import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { FirebaseModule } from '../../shared/firebase/firebase.module';
import { ProductsModule } from '../products/products.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { MailModule } from '../../shared/mail/mail.module';
@Module({
  imports: [FirebaseModule, ProductsModule, LoyaltyModule, MailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class CustomerOrdersModule {}
