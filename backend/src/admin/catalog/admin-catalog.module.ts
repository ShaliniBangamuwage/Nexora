import { Module } from '@nestjs/common';
import { FirebaseModule } from '../../shared/firebase/firebase.module.js';
import { AdminCatalogController } from './admin-catalog.controller.js';
import { AdminCatalogService } from './admin-catalog.service.js';

@Module({
  imports: [FirebaseModule],
  controllers: [AdminCatalogController],
  providers: [AdminCatalogService],
})
export class AdminCatalogModule {}
