import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseService } from '../shared/firebase/firebase.service.js';

interface SessionProfileInput {
  fullName?: string;
  phone?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async resolveSession(
    authorization: string | undefined,
    input: SessionProfileInput,
  ) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A Firebase ID token is required');
    }

    let token: DecodedIdToken & { role?: string };
    try {
      token = (await this.firebaseService
        .getAdmin()
        .verifyIdToken(authorization.slice('Bearer '.length))) as DecodedIdToken & {
        role?: string;
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }

    const db = this.firebaseService.getDb();
    const uid = token.uid;
    const adminRef = db.collection('admins').doc(uid);
    const customerCounterRef = db.doc('counters/customerId');
    const adminSnapshot = await adminRef.get();

    if (token.role === 'admin') {
      if (
        !adminSnapshot.exists ||
        (adminSnapshot.data()?.role ?? 'admin') !== 'admin' ||
        (adminSnapshot.data()?.status && adminSnapshot.data()?.status !== 'active')
      ) {
        throw new ForbiddenException('Admin account is not authorized');
      }

      const admin = adminSnapshot.data() ?? {};
      return {
        user: {
          uid,
          email: token.email ?? admin.email ?? '',
          role: 'admin',
          fullName: admin.fullName ?? admin.name ?? '',
          phone: admin.phone ?? '',
          status: admin.status ?? 'active',
        },
      };
    }

    if (adminSnapshot.exists || (token.role && token.role !== 'customer')) {
      throw new ForbiddenException('This account cannot create a customer session');
    }

    const userRef = db.collection('users').doc(uid);
    const fullName = String(
      input.fullName ?? token.name ?? token.email?.split('@')[0] ?? 'NEXORA Customer',
    )
      .trim()
      .slice(0, 120);
    const phone = String(input.phone ?? token.phone_number ?? '').trim().slice(0, 32);
    const email = token.email ?? '';
    let customer: Record<string, unknown> = {};

    await db.runTransaction(async (transaction) => {
      const [currentAdmin, userSnapshot, customerCounter] = await Promise.all([
        transaction.get(adminRef),
        transaction.get(userRef),
        transaction.get(customerCounterRef),
      ]);
      if (currentAdmin.exists) {
        throw new ForbiddenException('Admin account requires an admin ID token');
      }

      const previous = userSnapshot.data() ?? {};
      if (previous.status && previous.status !== 'active') {
        throw new ForbiddenException('Customer account is not active');
      }

      let customerId = String(previous.customerId ?? '');
      if (!customerId) {
        const nextNumber = Number(customerCounter.data()?.current ?? 0) + 1;
        customerId = `C${String(nextNumber).padStart(3, '0')}`;
        transaction.set(customerCounterRef, { current: nextNumber }, { merge: true });
      }

      const updates = {
        userId: uid,
        customerId,
        email,
        fullName: String(previous.fullName ?? '').trim() || fullName,
        phone: String(previous.phone ?? '').trim() || phone,
        role: 'customer',
        status: 'active',
        lastLogin: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        ...(!userSnapshot.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
      };
      transaction.set(userRef, updates, { merge: true });
      customer = { ...previous, ...updates, role: 'customer', status: 'active' };
    });

    return {
      user: {
        uid,
        email,
        role: 'customer',
        fullName: customer.fullName,
        phone: customer.phone,
        status: 'active',
      },
    };
  }
}
