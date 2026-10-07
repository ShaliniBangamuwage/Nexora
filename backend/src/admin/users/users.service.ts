import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service.js';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class UsersService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getAllUsers() {
    const db = this.firebaseService.getDb();
    try {
      const snapshot = await db
        .collection('users')
        .where('role', '==', 'customer')
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn(
        'orderBy/where failed, falling back to full fetch:',
        err.message,
      );
      const snapshot = await db.collection('users').get();
      const allDocs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as any[];
      return allDocs
        .filter((u) => !u.role || u.role === 'customer')
        .sort((a, b) => {
          const aTime = a.createdAt?._seconds ?? a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?._seconds ?? b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });
    }
  }

  async getUserById(id: string) {
    const db = this.firebaseService.getDb();
    const docSnap = await db.collection('users').doc(id).get();
    if (!docSnap.exists) throw new NotFoundException('User not found');
    return { id: docSnap.id, ...docSnap.data() };
  }

  async getAdminProfile(uid: string) {
    const snapshot = await this.firebaseService.getDb().collection('admins').doc(uid).get();
    if (!snapshot.exists) throw new NotFoundException('Admin profile not found');
    return { id: snapshot.id, ...snapshot.data() };
  }

  async updateAdminProfile(uid: string, input: { fullName?: string; phone?: string }) {
    const fullName = String(input.fullName ?? '').trim();
    if (!fullName) throw new BadRequestException('Name is required');
    const ref = this.firebaseService.getDb().collection('admins').doc(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new NotFoundException('Admin profile not found');
    await ref.update({
      fullName: fullName.slice(0, 120),
      phone: String(input.phone ?? '').trim().slice(0, 32),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  }

  async addLoyaltyPoints(id: string, points: number) {
    const db = this.firebaseService.getDb();
    const ref = db.collection('users').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('User not found');

    const current = (snap.data()?.loyaltyPoints || 0) + points;
    await ref.update({ loyaltyPoints: current });
    return { success: true, loyaltyPoints: current };
  }

  async updateStatus(id: string, status: string) {
    const db = this.firebaseService.getDb();
    const ref = db.collection('users').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('User not found');

    await ref.update({ status });
    return { success: true, status };
  }
}
