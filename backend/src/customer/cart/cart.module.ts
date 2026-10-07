import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { FirebaseModule } from '../../shared/firebase/firebase.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [FirebaseModule, ProductsModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
