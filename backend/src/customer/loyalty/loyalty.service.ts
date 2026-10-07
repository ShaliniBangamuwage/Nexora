import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { AIService } from './ai.service';
import { FieldValue } from 'firebase-admin/firestore';

export interface LoyaltyCustomer {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  totalSpent: number;
  totalPoints: number;
  level: 'Silver' | 'Gold' | 'Platinum';
  joinDate: Date;
  lastPurchase: Date;
  purchaseCount: number;
  averageOrderValue: number;
  refillConsistency: number;
  engagementScore: number;
  predictedChurnRisk: number;
  recommendedOffers: string[];
  birthday?: Date;
}

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly aiService: AIService,
  ) {}

  onModuleInit() {
    this.startWatchers();
  }

  private startWatchers() {
    const db = this.getDb();

    // Watch new users registering from Mobile App
    let isInitialUsersLoad = true;
    db.collection('users').onSnapshot((snapshot) => {
      if (isInitialUsersLoad) {
        isInitialUsersLoad = false;
        return;
      }
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const user = change.doc.data();
          const uid = change.doc.id;

          if (user.role === 'customer') {
            const loyaltyDoc = await db
              .collection('loyaltyCustomers')
              .doc(uid)
              .get();
            if (!loyaltyDoc.exists) {
              await db
                .collection('loyaltyCustomers')
                .doc(uid)
                .set({
                  uid,
                  name: user.fullName || user.name || '',
                  email: user.email || '',
                  phone: user.phone || '',
                  totalSpent: 0,
                  totalPoints: 10,
                  level: 'Silver',
                  joinDate: user.createdAt || FieldValue.serverTimestamp(),
                  lastPurchase: FieldValue.serverTimestamp(),
                  purchaseCount: 0,
                  averageOrderValue: 0,
                  refillConsistency: 0,
                  engagementScore: 50,
                  predictedChurnRisk: 20,
                  recommendedOffers: [],
                  updatedAt: FieldValue.serverTimestamp(),
                });
            }
          }
        }
      });
    });

    // Watch new orders placed from Mobile App (CustomerOrders)
    let isInitialOrdersLoad = true;
    db.collection('CustomerOrders').onSnapshot((snapshot) => {
      if (isInitialOrdersLoad) {
        isInitialOrdersLoad = false;
        return;
      }
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const order = change.doc.data();
          const uid = order.userId;
          if (uid && !uid.includes('@')) {
            const orderAmount = Number(order.totalAmount || 0);
            if (orderAmount > 0) {
              await this.addPurchase(uid, orderAmount, change.doc.id);
            }
          }
        }
      });
    });
  }

  private getDb() {
    return this.firebaseService.getDb();
  }

  private calculateLevel(points: number): 'Silver' | 'Gold' | 'Platinum' {
    if (points >= 5000) return 'Platinum';
    if (points >= 2000) return 'Gold';
    if (points >= 1000) return 'Silver';
    return 'Silver';
  }

  async getCustomerProfile(uid: string): Promise<LoyaltyCustomer | null> {
    const db = this.getDb();

    // 1. Fetch user doc for exact loyalty points (Single Source of Truth)
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // 2. Fetch orders for total spent / count
    const ordersProfile = await this.buildProfileFromOrders(uid);
    const doc = await db.collection('loyaltyCustomers').doc(uid).get();

    let profile: LoyaltyCustomer | null = null;
    if (ordersProfile) {
      profile = { ...ordersProfile };
    } else if (doc.exists) {
      profile = { id: doc.id, ...doc.data() } as LoyaltyCustomer;
    } else if (userData && userData.role === 'customer') {
      profile = {
        id: uid,
        uid,
        name: userData.fullName || userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        totalSpent: 0,
        totalPoints: 0,
        level: 'Silver',
        joinDate: userData.createdAt?.toDate?.() || new Date(),
        lastPurchase: new Date(),
        purchaseCount: 0,
        averageOrderValue: 0,
        refillConsistency: 0,
        engagementScore: 50,
        predictedChurnRisk: 20,
        recommendedOffers: [],
      };
    }

    if (profile && userData) {
      // ALWAYS override points and level with what is in the users document!
      if (userData.loyaltyPoints !== undefined) {
        profile.totalPoints = Number(userData.loyaltyPoints);
        if (profile.totalPoints >= 1000) profile.level = 'Platinum';
        else if (profile.totalPoints >= 500) profile.level = 'Gold';
        else profile.level = 'Silver';
      }
      profile.name = userData.fullName || userData.name || profile.name;
      profile.email = userData.email || profile.email;
      profile.phone = userData.phone || profile.phone;
    }

    if (profile) {
      // Sync back to loyaltyCustomers
      await db
        .collection('loyaltyCustomers')
        .doc(uid)
        .set(
          {
            ...profile,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    }

    return profile;
  }

  private async getNameEmailFromOrders(
    uid: string,
  ): Promise<{ name: string; email: string }> {
    try {
      const db = this.getDb();
      const snap = await db
        .collection('CustomerOrders')
        .where('userId', '==', uid)
        .limit(1)
        .get();
      if (!snap.empty) {
        const d = snap.docs[0].data();
        return { name: d.customerName || d.name || '', email: d.email || '' };
      }
    } catch (_) {}
    return { name: '', email: '' };
  }

  async getCustomerByEmailAndSync(
    email: string,
  ): Promise<LoyaltyCustomer | null> {
    const db = this.getDb();

    const ordersSnapshot = await db
      .collection('CustomerOrders')
      .where('email', '==', email)
      .get();

    if (ordersSnapshot.empty) {
      console.warn(`No orders found for email: ${email}`);
      return null;
    }

    const orders = ordersSnapshot.docs.map((doc) => doc.data());
    const totalSpent = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0,
    );
    const totalPoints = 10 + Math.floor(totalSpent * 0.01);
    const purchaseCount = orders.length;
    const sorted = orders
      .map((o) => ({ ...o, createdAt: o.createdAt?.toDate?.() || new Date(0) }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const uid =
      orders.find((o) => o.userId && !o.userId.includes('@'))?.userId || null;
    if (!uid) {
      console.warn(`No valid userId found for email ${email} — cannot sync`);
      return null;
    }

    const name = orders.find((o) => o.customerName)?.customerName || '';
    const phone = orders.find((o) => o.phone)?.phone || '';
    const level = this.calculateLevel(totalPoints);

    if (uid !== email) {
      const emailDocRef = db.collection('loyaltyCustomers').doc(email);
      const emailDoc = await emailDocRef.get();
      if (emailDoc.exists) {
        console.log(
          `Consolidating duplicate entry: deleting email-keyed entry for ${email}`,
        );
        await emailDocRef.delete();
      }
    }

    await db
      .collection('loyaltyCustomers')
      .doc(uid)
      .set(
        {
          uid,
          email,
          name,
          phone,
          totalSpent,
          totalPoints,
          level,
          joinDate: sorted[0]?.createdAt || FieldValue.serverTimestamp(),
          lastPurchase:
            sorted[sorted.length - 1]?.createdAt ||
            FieldValue.serverTimestamp(),
          purchaseCount,
          averageOrderValue: purchaseCount ? totalSpent / purchaseCount : 0,
          refillConsistency: 0,
          engagementScore: 50,
          predictedChurnRisk: 20,
          recommendedOffers: [],
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return {
      id: uid,
      uid,
      email,
      name,
      phone,
      totalSpent,
      totalPoints,
      level,
      joinDate: sorted[0]?.createdAt || new Date(),
      lastPurchase: sorted[sorted.length - 1]?.createdAt || new Date(),
      purchaseCount,
      averageOrderValue: purchaseCount ? totalSpent / purchaseCount : 0,
      refillConsistency: 0,
      engagementScore: 50,
      predictedChurnRisk: 20,
      recommendedOffers: [],
    };
  }

  async updateCustomerProfile(uid: string, updates: Partial<LoyaltyCustomer>) {
    const db = this.getDb();
    await db
      .collection('loyaltyCustomers')
      .doc(uid)
      .set(
        { ...updates, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
  }

  async syncLoyaltyToUserDoc(uid: string, points: number, level: string) {
    const db = this.getDb();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.update({
        loyaltyPoints: points,
        loyaltyTier: level,
      });
    }
  }

  async calculatePoints(orderAmount: number): Promise<number> {
    return Math.floor(orderAmount * 0.01);
  }

  async addPurchase(uid: string, orderAmount: number, orderId: string) {
    const db = this.getDb();
    const points = await this.calculatePoints(orderAmount);
    const profile = await this.getCustomerProfile(uid);

    if (!profile) {
      const { name, email } = await this.getNameEmailFromOrders(uid);
      await db
        .collection('loyaltyCustomers')
        .doc(uid)
        .set({
          uid,
          name,
          email,
          totalSpent: orderAmount,
          totalPoints: points,
          level: this.calculateLevel(points),
          joinDate: FieldValue.serverTimestamp(),
          lastPurchase: FieldValue.serverTimestamp(),
          purchaseCount: 1,
          averageOrderValue: orderAmount,
          refillConsistency: 0,
          engagementScore: 50,
          predictedChurnRisk: 20,
          recommendedOffers: [],
          updatedAt: FieldValue.serverTimestamp(),
        });
    } else {
      const newTotalSpent = (profile.totalSpent || 0) + orderAmount;
      const newPurchaseCount = (profile.purchaseCount || 0) + 1;
      const newTotalPoints = (profile.totalPoints || 0) + points;
      const newLevel = this.calculateLevel(newTotalPoints);
      await this.updateCustomerProfile(uid, {
        totalSpent: newTotalSpent,
        totalPoints: newTotalPoints,
        level: newLevel,
        lastPurchase: new Date(),
        purchaseCount: newPurchaseCount,
        averageOrderValue: newTotalSpent / newPurchaseCount,
      });
    }

    await db.collection('loyaltyPurchases').add({
      uid,
      orderId,
      amount: orderAmount,
      pointsEarned: points,
      date: FieldValue.serverTimestamp(),
    });
  }

  private async buildProfileFromOrders(
    uid: string,
  ): Promise<LoyaltyCustomer | null> {
    const db = this.getDb();
    const ordersSnapshot = await db
      .collection('CustomerOrders')
      .where('userId', '==', uid)
      .get();

    if (ordersSnapshot.empty) return null;

    const orders = ordersSnapshot.docs.map((doc) => doc.data());
    const totalSpent = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0,
    );
    const totalPoints = Math.floor(totalSpent * 0.01);
    const purchaseCount = orders.length;
    const sorted = orders
      .map((o) => ({ ...o, createdAt: o.createdAt?.toDate?.() || new Date(0) }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return {
      id: uid,
      uid,
      name: orders.find((o) => o.customerName)?.customerName || '',
      email: orders.find((o) => o.email)?.email || '',
      phone: orders.find((o) => o.phone)?.phone || '',
      totalSpent,
      totalPoints,
      level: this.calculateLevel(totalPoints),
      joinDate: sorted[0].createdAt,
      lastPurchase: sorted[sorted.length - 1].createdAt,
      purchaseCount,
      averageOrderValue: purchaseCount ? totalSpent / purchaseCount : 0,
      refillConsistency: 0,
      engagementScore: 50,
      predictedChurnRisk: 20,
      recommendedOffers: [],
    };
  }

  private async buildOrdersCustomerMap() {
    const db = this.getDb();
    const snapshot = await db.collection('CustomerOrders').get();
    const orderMap = new Map<
      string,
      {
        totalSpent: number;
        totalPoints: number;
        purchaseCount: number;
        level: 'Silver' | 'Gold' | 'Platinum';
        name: string;
        email: string;
        phone: string;
      }
    >();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const uid = data.userId;
      // FIX: Only use userId — never fall back to email as key
      if (!uid || uid.includes('@')) return;

      const existing = orderMap.get(uid) || {
        totalSpent: 0,
        totalPoints: 0,
        purchaseCount: 0,
        level: 'Silver' as const,
        name: data.customerName || '',
        email: data.email || '',
        phone: data.phone || '',
      };

      existing.totalSpent += Number(data.totalAmount || 0);
      existing.totalPoints += Math.floor(Number(data.totalAmount || 0) * 0.01);
      existing.purchaseCount += 1;
      existing.level = this.calculateLevel(existing.totalPoints);
      existing.name = existing.name || data.customerName || '';
      existing.email = existing.email || data.email || '';
      existing.phone = existing.phone || data.phone || '';

      orderMap.set(uid, existing);
    });

    return orderMap;
  }

  async getTopCustomers(limit = 10): Promise<LoyaltyCustomer[]> {
    const db = this.getDb();

    // Single source of truth: CustomerOrders
    const ordersMap = await this.buildOrdersCustomerMap();

    // Fetch all users at once instead of making N parallel queries
    const usersSnapshot = await db.collection('users').get();
    const usersMap = new Map();
    usersSnapshot.docs.forEach((doc) => usersMap.set(doc.id, doc.data()));

    const customers: LoyaltyCustomer[] = Array.from(ordersMap.entries()).map(
      ([uid, orderData]) => {
        const userData = usersMap.get(uid) || null;

        const name =
          userData?.fullName || userData?.name || orderData.name || '';
        const email = userData?.email || orderData.email || '';

        return {
          id: uid,
          uid,
          name,
          email,
          phone: userData?.phone || orderData.phone || '',
          totalSpent: orderData.totalSpent,
          totalPoints: orderData.totalPoints,
          level: orderData.level,
          joinDate: new Date(),
          lastPurchase: new Date(),
          purchaseCount: orderData.purchaseCount,
          averageOrderValue: orderData.purchaseCount
            ? orderData.totalSpent / orderData.purchaseCount
            : 0,
          refillConsistency: 0,
          engagementScore: 50,
          predictedChurnRisk: 20,
          recommendedOffers: [],
        };
      },
    );

    const deduped = new Map<string, LoyaltyCustomer>();
    for (const customer of customers) {
      const key = customer.email || customer.uid;
      const existing = deduped.get(key);
      if (!existing || customer.totalPoints > existing.totalPoints) {
        deduped.set(key, customer);
      }
    }

    return Array.from(deduped.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  async getAnalytics() {
    const db = this.getDb();

    try {
      const loyaltySnapshot = await db.collection('loyaltyCustomers').get();
      const ordersMap = await this.buildOrdersCustomerMap();
      const customerMap = new Map<
        string,
        {
          totalSpent: number;
          totalPoints: number;
          purchaseCount: number;
          level: 'Silver' | 'Gold' | 'Platinum';
        }
      >();

      loyaltySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const orderData = ordersMap.get(doc.id);
        const totalSpent = orderData
          ? orderData.totalSpent
          : Number(data.totalSpent || 0);
        const totalPoints = orderData
          ? orderData.totalPoints
          : Number(data.totalPoints || 0);
        const purchaseCount = orderData
          ? orderData.purchaseCount
          : Number(data.purchaseCount || 0);
        const level = orderData
          ? orderData.level
          : (data.level as 'Silver' | 'Gold' | 'Platinum') || 'Silver';

        customerMap.set(doc.id, {
          totalSpent,
          totalPoints,
          purchaseCount,
          level,
        });
      });

      ordersMap.forEach((orderData, uid) => {
        if (!customerMap.has(uid)) {
          customerMap.set(uid, {
            totalSpent: orderData.totalSpent,
            totalPoints: orderData.totalPoints,
            purchaseCount: orderData.purchaseCount,
            level: orderData.level,
          });
        }
      });

      const values = Array.from(customerMap.values());
      const totalRevenue = values.reduce((sum, v) => sum + v.totalSpent, 0);
      const totalPoints = values.reduce((sum, v) => sum + v.totalPoints, 0);
      const totalOrders = values.reduce((sum, v) => sum + v.purchaseCount, 0);

      return {
        totalCustomers: values.length,
        totalRevenue,
        totalPoints,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        levelDistribution: {
          Silver: values.filter((v) => v.level === 'Silver').length,
          Gold: values.filter((v) => v.level === 'Gold').length,
          Platinum: values.filter((v) => v.level === 'Platinum').length,
        },
      };
    } catch (error) {
      console.error('getAnalytics loyaltyCustomers error:', error);
    }

    // Fallback: build from CustomerOrders if something failed
    const ordersMap = await this.buildOrdersCustomerMap();
    const values = Array.from(ordersMap.values());
    const totalRevenue = values.reduce((sum, v) => sum + v.totalSpent, 0);
    const totalPoints = values.reduce((sum, v) => sum + v.totalPoints, 0);
    const totalOrders = values.reduce((sum, v) => sum + v.purchaseCount, 0);

    return {
      totalCustomers: values.length,
      totalRevenue,
      totalPoints,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      levelDistribution: {
        Silver: values.filter((v) => v.level === 'Silver').length,
        Gold: values.filter((v) => v.level === 'Gold').length,
        Platinum: values.filter((v) => v.level === 'Platinum').length,
      },
    };
  }

  async predictChurnRisk(uid: string): Promise<number> {
    const profile = await this.getCustomerProfile(uid);
    if (!profile) return 100;
    return this.aiService.predictChurnRisk(profile);
  }

  async generatePersonalizedOffers(uid: string): Promise<string[]> {
    const profile = await this.getCustomerProfile(uid);
    if (!profile) return [];
    return this.aiService.generatePersonalizedOffers(profile);
  }

  async syncFromOrders() {
    const db = this.getDb();
    const ordersSnapshot = await db.collection('CustomerOrders').get();
    const dispensedSnapshot = await db.collection('pharmacistDispensed').get();
    const usersSnapshot = await db.collection('users').get();

    const emailToUid = new Map<string, string>();
    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.email) emailToUid.set(data.email.toLowerCase(), doc.id);
    });

    await this.cleanupEmailKeyedLoyaltyDocs();

    const ordersByUser: Record<string, any[]> = {};
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const uid = order.userId;
      if (!uid || uid.includes('@')) continue;
      if (!ordersByUser[uid]) ordersByUser[uid] = [];
      ordersByUser[uid].push({
        id: orderDoc.id,
        ...order,
        totalAmount: Number(order.totalAmount || 0),
      });
    }

    for (const doc of dispensedSnapshot.docs) {
      const dispense = doc.data();
      if (dispense.paymentStatus === 'paid' || dispense.total) {
        const email = dispense.patientEmail;
        if (email) {
          const uid = emailToUid.get(email.toLowerCase());
          if (uid) {
            if (!ordersByUser[uid]) ordersByUser[uid] = [];
            ordersByUser[uid].push({
              id: doc.id,
              ...dispense,
              totalAmount: Number(dispense.total || 0),
              createdAt: dispense.createdAt || FieldValue.serverTimestamp(),
            });
          }
        }
      }
    }

    usersSnapshot.docs.forEach((doc) => {
      if (!ordersByUser[doc.id]) ordersByUser[doc.id] = [];
    });

    const entries = Object.entries(ordersByUser);
    const BATCH_SIZE = 400; // Keep under 500 to be safe
    let batch = db.batch();
    let operationCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const [uid, orders] = entries[i];
      const totalSpent = orders.reduce(
        (sum, o) => sum + Number(o.totalAmount || 0),
        0,
      );
      const purchaseCount = orders.length;
      const totalPoints = 10 + Math.floor(totalSpent * 0.01);
      const level = this.calculateLevel(totalPoints);

      const sorted = [...orders].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      const latest = sorted.length > 0 ? sorted[0] : null;
      const oldest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
      const userDoc =
        usersSnapshot.docs.find((d) => d.id === uid)?.data() || {};

      const loyaltyRef = db.collection('loyaltyCustomers').doc(uid);
      batch.set(
        loyaltyRef,
        {
          uid,
          name: latest?.customerName || latest?.name || userDoc.fullName || '',
          email: latest?.email || userDoc.email || '',
          phone: latest?.phone || userDoc.phone || '',
          totalSpent,
          totalPoints,
          level,
          joinDate:
            oldest?.createdAt ||
            userDoc.createdAt ||
            FieldValue.serverTimestamp(),
          lastPurchase: latest?.createdAt || FieldValue.serverTimestamp(),
          purchaseCount,
          averageOrderValue: purchaseCount ? totalSpent / purchaseCount : 0,
          refillConsistency: 0,
          engagementScore: 50,
          predictedChurnRisk: 20,
          recommendedOffers: [],
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      operationCount++;

      const userRef = db.collection('users').doc(uid);
      batch.update(userRef, {
        loyaltyPoints: totalPoints,
        loyaltyTier: level,
      });
      operationCount++;

      if (operationCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    return { success: true, synced: entries.length };
  }

  private async cleanupEmailKeyedLoyaltyDocs() {
    const db = this.getDb();
    const snapshot = await db.collection('loyaltyCustomers').get();

    let batch = db.batch();
    let operationCount = 0;
    const BATCH_SIZE = 400;

    for (const doc of snapshot.docs) {
      if (doc.id.includes('@')) {
        batch.delete(doc.ref);
        operationCount++;
        console.log(
          'Queued delete for stale email-keyed loyalty entry:',
          doc.id,
        );

        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          operationCount = 0;
        }
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }
  }

  async consolidateDuplicates() {
    const db = this.getDb();
    const loyaltySnapshot = await db.collection('loyaltyCustomers').get();

    const entries = new Map<string, any>();
    for (const doc of loyaltySnapshot.docs) {
      entries.set(doc.id, { id: doc.id, ...doc.data() });
    }

    const ordersSnapshot = await db.collection('CustomerOrders').get();
    const uidToEmail = new Map<string, string>();
    const emailToUid = new Map<string, string>();

    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const uid = order.userId;
      const email = order.email;
      if (uid && email) {
        uidToEmail.set(uid, email);
        emailToUid.set(email, uid);
      }
    }

    const toDelete: string[] = [];

    for (const [key, entry] of entries.entries()) {
      const email = entry.email;
      if (!email) continue;

      if (key === email) {
        const correctUid = emailToUid.get(email);
        if (correctUid && correctUid !== key && entries.has(correctUid)) {
          console.log(
            `Found duplicate: ${email} - deleting email-keyed entry, keeping uid=${correctUid}`,
          );
          toDelete.push(key);
        }
      }
    }

    let batch = db.batch();
    let operationCount = 0;
    const BATCH_SIZE = 400;

    for (const key of toDelete) {
      batch.delete(db.collection('loyaltyCustomers').doc(key));
      operationCount++;
      console.log(`Queued delete for duplicate email-keyed entry: ${key}`);

      if (operationCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    return {
      success: true,
      duplicatesConsolidated: toDelete.length,
      deletedKeys: toDelete,
    };
  }
}
