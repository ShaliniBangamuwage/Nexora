import * as dotenv from 'dotenv';
dotenv.config();
import { Injectable, OnModuleInit } from '@nestjs/common';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db!: Firestore;
  private auth!: Auth;

  onModuleInit() {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // ✅ add this line
      });
    }
    this.db = getFirestore();
    this.auth = getAuth();
  }

  getDb(): Firestore {
    return this.db;
  }

  getAdmin(): Auth {
    return this.auth;
  }
}
