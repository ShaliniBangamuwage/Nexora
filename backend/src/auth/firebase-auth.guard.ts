// src/auth/firebase-auth.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseService } from '../shared/firebase/firebase.service.js';
// Extend Express Request so TypeScript knows request.user exists
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string | undefined;
    role: string | undefined;
  };
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const firebaseAuth = this.firebaseService.getAdmin();
      const decodedToken: DecodedIdToken =
        await firebaseAuth.verifyIdToken(token);
      const uid = decodedToken.uid;
      const db = this.firebaseService.getDb();
      let role = decodedToken.role;
      const adminDoc = await db.collection('admins').doc(uid).get();
      const userDoc = await db.collection('users').doc(uid).get();

      if (role === 'admin') {
        if (!adminDoc.exists || (adminDoc.data()?.role ?? 'admin') !== 'admin') {
          throw new UnauthorizedException('Admin account is not authorized');
        }
      } else if (!role || role === 'customer') {
        if (!userDoc.exists) {
          throw new UnauthorizedException('Customer account is not authorized');
        }
        role = 'customer';
      } else {
        throw new UnauthorizedException('Unsupported role for this storefront');
      }

      let isActive = true;
      if (role === 'customer') {
        const status = userDoc.data()?.status;
        isActive = !status || status === 'active';
      } else if (role === 'admin') {
        const status = adminDoc.data()?.status;
        isActive = !status || status === 'active';
      }

      if (role !== 'customer' && role !== 'admin') {
        throw new UnauthorizedException('Unsupported role for this storefront');
      }

      if (!isActive) {
        throw new UnauthorizedException(
          'Your account is suspended or pending approval.',
        );
      }

      request.user = {
        uid: uid,
        email: decodedToken.email,
        role: role,
      };

      return true;
    } catch (error) {
      console.error('Auth Guard Error:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
