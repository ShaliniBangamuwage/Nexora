import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class ProfileService {
  constructor(private readonly firebaseService: FirebaseService) {}

  // Mirrors loyalty.service.ts calculateLevel() — keep thresholds in sync
  private calculateLevel(points: number): 'Silver' | 'Gold' | 'Platinum' {
    if (points >= 5000) return 'Platinum';
    if (points >= 2000) return 'Gold';
    return 'Silver';
  }

  // Calculate loyalty data from CustomerOrders for a given uid
  private async getLoyaltyFromOrders(uid: string, db: any) {
    const ordersSnap = await db
      .collection('CustomerOrders')
      .where('userId', '==', uid)
      .get();

    if (ordersSnap.empty) {
      return {
        loyaltyPoints: 10,
        totalPoints: 10,
        level: 'Silver',
        recommendedOffers: [],
      };
    }

    // 1 point for every Rs. 100 spent on each order.
    // Math.floor removes fractional points for each individual order.
    const totalPoints = ordersSnap.docs.reduce((sum: number, doc: any) => {
      const orderAmount = Number(doc.data().totalAmount || 0);
      return sum + Math.floor(orderAmount * 0.01);
    }, 0);

    return {
      loyaltyPoints: totalPoints,
      totalPoints,
      level: this.calculateLevel(totalPoints),
      recommendedOffers: [],
    };
  }

  async getProfile(uid: string) {
    const db = this.firebaseService.getDb();

    // Fetch user doc and loyalty collection doc in parallel
    const [snap, loyaltySnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('loyaltyCustomers').doc(uid).get(),
    ]);

    // Always calculate from CustomerOrders — never trust the cache.
    // This matches the pharmacist dashboard's source of truth.
    const loyaltyData = await this.getLoyaltyFromOrders(uid, db);

    // If loyaltyCustomers doc exists, only use recommendedOffers from it.
    // AI-generated offers are not stored in CustomerOrders.
    if (loyaltySnap.exists) {
      const l = loyaltySnap.data();
      loyaltyData.recommendedOffers = l?.recommendedOffers ?? [];
    }

    // If users doc exists, merge and return
    if (snap.exists) {
      return {
        id: snap.id,
        ...snap.data(),
        ...loyaltyData,
      };
    }

    // Fallback: build profile from CustomerOrders if no users doc
    const ordersSnap = await db
      .collection('CustomerOrders')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (!ordersSnap.empty) {
      const order = ordersSnap.docs[0].data();

      // Auto-create users doc so future calls are faster
      await db
        .collection('users')
        .doc(uid)
        .set({
          fullName: order.customerName || '',
          email: order.email || '',
          phone: order.phone || '',
          role: 'customer',
          status: 'active',
          createdAt: FieldValue.serverTimestamp(),
        });

      return {
        id: uid,
        fullName: order.customerName || '',
        email: order.email || '',
        phone: order.phone || '',
        role: 'customer',
        status: 'active',
        ...loyaltyData,
      };
    }

    throw new NotFoundException('User not found');
  }

  async updateProfile(uid: string, body: any) {
    const db = this.firebaseService.getDb();
    const docRef = db.collection('users').doc(uid);

    const updatePayload: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // only update fields that are provided
    if (body.fullName !== undefined) updatePayload.fullName = body.fullName;
    if (body.phone !== undefined) updatePayload.phone = body.phone;
    if (body.address !== undefined) updatePayload.address = body.address;
    if (body.photoURL !== undefined) updatePayload.photoURL = body.photoURL;
    for (const field of ['district', 'city', 'houseNumber', 'laneStreet', 'secondaryPhone'] as const) {
      if (body[field] !== undefined) updatePayload[field] = String(body[field]).trim();
    }

    await docRef.update(updatePayload);

    return { success: true, uid };
  }
}
