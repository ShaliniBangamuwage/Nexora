import { Module } from '@nestjs/common';
import { CountersService } from './counters.service';
import { FirebaseModule } from '../../shared/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  providers: [CountersService],
  exports: [CountersService], // exported so supplier products can use it
})
export class CountersModule {}
