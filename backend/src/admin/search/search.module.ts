import { Module } from '@nestjs/common';
import { AdminSearchController } from './search.controller.js';
import { SearchModule } from '../../shared/search/search.module.js';
import { FirebaseModule } from '../../shared/firebase/firebase.module.js';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';

@Module({
  imports: [SearchModule, FirebaseModule],
  controllers: [AdminSearchController],
  providers: [FirebaseAuthGuard],
})
export class AdminSearchModule {}
