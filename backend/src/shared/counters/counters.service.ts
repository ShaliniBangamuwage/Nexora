import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class CountersService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async generateProductCode(): Promise<string> {
    const db = this.firebaseService.getDb();
    const counterRef = db.doc('counters/productCode');

    const nextNumber = await db.runTransaction(async (transaction) => {
      const counterSnap = await transaction.get(counterRef);

      if (!counterSnap.exists) {
        transaction.set(counterRef, { current: 1 });
        return 1;
      }

      const next = (counterSnap.data()?.current || 0) + 1;
      transaction.update(counterRef, { current: next });
      return next;
    });

    return `P${String(nextNumber).padStart(3, '0')}`;
  }
}
