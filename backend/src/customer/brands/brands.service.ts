import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class BrandsService {
  private cache: { data: any[]; ts: number } | null = null;
  private readonly TTL = 60_000;

  constructor(private readonly firebaseService: FirebaseService) {}

  async getBrands() {
    if (this.cache && Date.now() - this.cache.ts < this.TTL) {
      return this.cache.data;
    }

    const db = this.firebaseService.getDb();
    const snapshot = await db.collection('brands').get();
    const data = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, any>))
      .filter((brand) => brand.domain === 'electronics' && brand.status !== 'archived')
      .sort((left: any, right: any) => {
        const leftDate = left.createdAt?.seconds ?? (Date.parse(left.createdAt ?? '') || 0);
        const rightDate = right.createdAt?.seconds ?? (Date.parse(right.createdAt ?? '') || 0);
        return rightDate - leftDate;
      });
    this.cache = { data, ts: Date.now() };
    return data;
  }

  async addBrand(body: any) {
    const db = this.firebaseService.getDb();
    this.cache = null; // invalidate cache so next GET is fresh
    const docRef = await db.collection('brands').add({
      name: body.name,
      domain: 'electronics',
      status: 'active',
      tagline: body.tagline || '',
      description: body.description,
      category: body.category,
      imageUrl: body.imageUrl || '',
      rating: Number(body.rating) || 0,
      products: Number(body.products) || 0,
      established: Number(body.established) || 0,
      country: body.country || '',
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  }
}
