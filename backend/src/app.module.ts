import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module.js';

// Shared
import { FirebaseModule } from './shared/firebase/firebase.module.js';
import { CountersModule } from './shared/counters/counters.module.js';
import { MailModule } from './shared/mail/mail.module.js';

// Admin
import { UsersModule } from './admin/users/users.module.js';
import { OrdersModule } from './admin/orders/orders.module.js';
import { NotificationsModule } from './admin/notifications/notifications.module.js';
import { AdminSearchModule } from './admin/search/search.module.js';
import { AccountRequestsModule } from './admin/account-requests/account-requests.module.js';
import { AdminProductApprovalModule } from './admin/adminProducts/admin-product-approval.module.js';
import { AdminCatalogModule } from './admin/catalog/admin-catalog.module.js';
import { ForecastModule } from './admin/forecast/forecast.module.js';

// Customer
import { CartModule } from './customer/cart/cart.module.js';
import { CustomerOrdersModule } from './customer/orders/orders.module.js';
import { ProductsModule } from './customer/products/products.module.js';
import { ReturnsModule } from './customer/returns/returns.module.js';
import { ProfileModule } from './customer/profile/profile.module.js';
import { BrandsModule } from './customer/brands/brands.module.js';
import { ContactModule } from './customer/contact/contact.module.js';
import { LoyaltyModule } from './customer/loyalty/loyalty.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Serve uploaded media statically
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Shared
    FirebaseModule,
    AuthModule,
    CountersModule,
    MailModule,

    // Admin
    UsersModule,
    OrdersModule,
    NotificationsModule,
    AdminSearchModule,
    AccountRequestsModule,
    AdminProductApprovalModule,
    AdminCatalogModule,
    ScheduleModule.forRoot(), // enables @Cron
    ForecastModule,

    // Customer
    CartModule,
    CustomerOrdersModule,
    ProductsModule,
    ReturnsModule,
    ProfileModule,
    BrandsModule,
    ContactModule,
    LoyaltyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
