import { Module } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { SyncService } from './sync.service.js';
import { FirebaseModule } from '../../shared/firebase/firebase.module.js';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
@Module({
  imports: [FirebaseModule],
  controllers: [],
  providers: [SearchService, SyncService, FirebaseAuthGuard],
  exports: [SearchService, SyncService], // ← exported so role modules can inject them
})
export class SearchModule {}
