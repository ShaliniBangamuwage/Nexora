import { Injectable } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { FirebaseService } from '../../shared/firebase/firebase.service.js';

@Injectable()
export class SyncService {
  constructor(
    private searchService: SearchService,
    private firebaseService: FirebaseService,
  ) {}

  async syncAllProducts(): Promise<unknown> {
    const db = this.firebaseService.getDb(); // ← changed from getFirestore()
    const snapshot = await db.collection('products').get();
    console.log(`\n🔄 Starting sync of ${snapshot.size} products...\n`);

    let success = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
      const product = doc.data();
      try {
        await this.searchService.upsertProductToIndex(doc.id, {
          id: doc.id,
          ...product,
          similarityScore: 0,
          searchSource: 'sync',
        });
        success++;
        console.log(
          `  ✅ (${success}/${snapshot.size}) ${String(product['name'] ?? '')}`,
        );
      } catch (err: unknown) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Failed: ${String(product['name'] ?? '')} — ${msg}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`\n✅ Sync complete: ${success} succeeded, ${failed} failed\n`);
    return { message: 'Sync complete', total: snapshot.size, success, failed };
  }
}
