import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { ProductsService } from '../products/products.service';
import { FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

interface CustomerIdentity {
  uid: string;
  email?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly productsService: ProductsService,
  ) {}

  private getShippingFee() {
    const value = Number(process.env.SHIPPING_FEE_LKR ?? 400);
    return Number.isFinite(value) && value >= 0 ? value : 400;
  }

  async createOrder(body: any, user: CustomerIdentity) {
    if (!user?.uid) throw new ForbiddenException('Customer authentication required');
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length) throw new BadRequestException('Cart is empty');
    if (!['ONLINE', 'COD', 'WHATSAPP'].includes(String(body.paymentMethod).toUpperCase())) {
      throw new BadRequestException('Unsupported payment method');
    }

    const required = ['firstName', 'lastName', 'phone', 'houseNumber', 'laneStreet', 'city', 'district'];
    for (const field of required) {
      if (!String(body[field] ?? '').trim()) {
        throw new BadRequestException(`${field} is required`);
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email ?? user.email ?? ''))) {
      throw new BadRequestException('A valid email address is required');
    }
    if (!/^(?:0|\+94)\d{9}$/.test(String(body.phone).replace(/\s+/g, ''))) {
      throw new BadRequestException('A valid Sri Lankan phone number is required');
    }

    const db = this.firebaseService.getDb();
    const normalized = new Map<string, number>();
    for (const item of rawItems) {
      const productId = String(item.productId ?? item.id ?? '').trim();
      const quantity = Number(item.quantity ?? item.qty);
      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        throw new BadRequestException('Each order item needs a product ID and positive integer quantity');
      }
      normalized.set(productId, (normalized.get(productId) ?? 0) + quantity);
    }

    const products = await Promise.all(
      [...normalized.keys()].map(async (key) => {
        let snap = await db.collection('products').doc(key).get();
        if (!snap.exists) {
          const byCode = await db.collection('products').where('productCode', '==', key).limit(1).get();
          if (byCode.empty) throw new NotFoundException(`Product ${key} is unavailable`);
          snap = byCode.docs[0];
        }
        if (!(await this.productsService.isStorefrontCategory(snap.data()?.category))) {
          throw new NotFoundException('Product is not part of the electronics catalog');
        }
        return { ref: snap.ref, id: snap.id, quantity: normalized.get(key)! };
      }),
    );

    const orderId = `NX-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const orderRef = db.collection('CustomerOrders').doc();
    const paymentMethod = String(body.paymentMethod).toUpperCase();
    const shippingFee = this.getShippingFee();
    let orderTotal = 0;
    let orderItems: Array<Record<string, any>> = [];

    await db.runTransaction(async (transaction) => {
      const productSnapshots = await Promise.all(products.map(({ ref }) => transaction.get(ref)));
      orderItems = productSnapshots.map((snapshot, index) => {
        if (!snapshot.exists) throw new NotFoundException('A product is no longer available');
        const data = snapshot.data()!;
        if (['archived', 'hidden', 'draft', 'inactive', 'out_of_stock'].includes(String(data.status ?? '').toLowerCase())) {
          throw new BadRequestException(`${data.name ?? data.productName ?? 'Product'} is unavailable`);
        }
        const quantity = products[index].quantity;
        const stock = Number(data.stock ?? 0);
        if (!Number.isFinite(stock) || stock < quantity) {
          throw new BadRequestException(`Insufficient stock for ${data.name ?? data.productName ?? 'product'}`);
        }
        const price = Number(data.price ?? data.retailPrice ?? 0);
        if (!Number.isFinite(price) || price <= 0) {
          throw new BadRequestException('A product has an invalid price');
        }
        return {
          productId: products[index].id,
          name: String(data.name ?? data.productName ?? 'Product'),
          brand: String(data.brand ?? data.manufacturer ?? ''),
          category: String(data.category ?? ''),
          price,
          quantity,
          imageUrl: String(data.imageUrl ?? data.images?.[0] ?? ''),
          subtotal: Number((price * quantity).toFixed(2)),
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      orderTotal = Number((subtotal + shippingFee).toFixed(2));
      const fullName = `${String(body.firstName).trim()} ${String(body.lastName).trim()}`;
      const orderData = {
        orderId,
        userId: user.uid,
        customerName: fullName,
        firstName: String(body.firstName).trim(),
        lastName: String(body.lastName).trim(),
        email: user.email ?? String(body.email ?? '').trim(),
        phone: String(body.phone).trim(),
        secondaryPhone: String(body.secondaryPhone ?? '').trim(),
        address: [body.houseNumber, body.laneStreet, body.city, body.district].map((v) => String(v).trim()).join(', '),
        houseNumber: String(body.houseNumber).trim(),
        laneStreet: String(body.laneStreet).trim(),
        city: String(body.city).trim(),
        district: String(body.district).trim(),
        country: 'Sri Lanka',
        orderNotes: String(body.orderNotes ?? '').trim(),
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: paymentMethod === 'COD'
          ? 'Pending-COD'
          : paymentMethod === 'WHATSAPP'
            ? 'Pending-WhatsApp-Confirmation'
            : 'Pending-Payment',
        subtotal: Number((orderTotal - shippingFee).toFixed(2)),
        shippingFee,
        totalAmount: orderTotal,
        categories: [...new Set(orderItems.map((item) => item.category).filter(Boolean))],
        items: orderItems,
        types: orderItems,
        stockReserved: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      products.forEach(({ ref, quantity }, index) => {
        const currentStock = Number(productSnapshots[index].data()?.stock ?? 0);
        transaction.update(ref, { stock: currentStock - quantity, updatedAt: FieldValue.serverTimestamp() });
      });
      transaction.create(orderRef, orderData);
    });

    return { success: true, id: orderRef.id, orderId, totalAmount: orderTotal, shippingFee, items: orderItems };
  }

  async generateHash(orderId: string, currency: string, user: CustomerIdentity) {
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const secret = process.env.PAYHERE_SECRET;
    if (!merchantId || !secret) {
      throw new ServiceUnavailableException('PayHere sandbox credentials are not configured');
    }
    if (currency !== (process.env.PAYHERE_CURRENCY || 'LKR')) {
      throw new BadRequestException('Unsupported payment currency');
    }

    const db = this.firebaseService.getDb();
    const snap = await db.collection('CustomerOrders').where('orderId', '==', orderId).limit(1).get();
    if (snap.empty) throw new NotFoundException('Order not found');
    const order = snap.docs[0].data();
    if (order.userId !== user.uid || order.paymentMethod !== 'ONLINE') {
      throw new ForbiddenException('This order cannot be paid by this account');
    }
    if (order.paymentStatus !== 'pending') throw new BadRequestException('Order is not awaiting payment');

    const actualAmount = Number(order.totalAmount).toFixed(2);
    const hashedSecret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
    const hash = crypto.createHash('md5')
      .update(`${merchantId}${orderId}${actualAmount}${currency}${hashedSecret}`)
      .digest('hex').toUpperCase();
    return { hash, merchantId, actualAmount, currency };
  }

  async getOrders(userId: string) {
    const db = this.firebaseService.getDb();
    const snapshot = await db.collection('CustomerOrders').where('userId', '==', userId).get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  }

  async getDeliveredOrders(userId: string) {
    const db = this.firebaseService.getDb();
    const snapshot = await db.collection('CustomerOrders').where('userId', '==', userId).get();
    return snapshot.docs
      .filter((doc) => String(doc.data().orderStatus ?? '').toLowerCase() === 'delivered')
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getProductCodeByName(name: string) {
    const db = this.firebaseService.getDb();
    const snapshot = await db.collection('products').where('name', '==', name).limit(1).get();
    if (snapshot.empty) return { productCode: null };
    return { productCode: snapshot.docs[0].data().productCode ?? null };
  }

  async getOrderDetails(orderId: string, user: CustomerIdentity & { role?: string }) {
    const db = this.firebaseService.getDb();
    const snap = await db.collection('CustomerOrders').where('orderId', '==', orderId).limit(1).get();
    if (snap.empty) throw new NotFoundException('Order not found');
    const order = snap.docs[0].data();
    if (order.userId !== user.uid && user.role !== 'admin') {
      throw new ForbiddenException('You cannot view this order');
    }
    return { id: snap.docs[0].id, ...order };
  }

  async cancelPendingPayment(orderId: string, userId: string) {
    const db = this.firebaseService.getDb();
    const orderQuery = await db.collection('CustomerOrders').where('orderId', '==', orderId).limit(1).get();
    if (orderQuery.empty) throw new NotFoundException('Order not found');
    const orderRef = orderQuery.docs[0].ref;
    await db.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      const order = orderSnap.data();
      if (!order || order.userId !== userId) throw new ForbiddenException('You cannot cancel this order');
      if (order.paymentStatus !== 'pending' || !order.stockReserved) return;
      const items = Array.isArray(order.items) ? order.items : [];
      const productRefs = items.map((item: any) => db.collection('products').doc(String(item.productId)));
      const productSnaps = await Promise.all(productRefs.map((ref: any) => transaction.get(ref)));
      productSnaps.forEach((productSnap: any, index: number) => {
        if (productSnap.exists) {
          transaction.update(productRefs[index], {
            stock: Number(productSnap.data()?.stock ?? 0) + Number(items[index].quantity ?? 0),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });
      transaction.update(orderRef, {
        paymentStatus: 'cancelled',
        orderStatus: 'Payment-Cancelled',
        stockReserved: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return { success: true };
  }

  async handleNotify(body: any) {
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const secret = process.env.PAYHERE_SECRET;
    if (!merchantId || !secret) return { received: false, reason: 'credentials_not_configured' };

    const orderId = String(body.order_id ?? '');
    const amount = String(body.payhere_amount ?? '');
    const currency = String(body.payhere_currency ?? '');
    const statusCode = String(body.status_code ?? '');
    const providedSignature = String(body.md5sig ?? '').toUpperCase();
    const hashedSecret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
    const expectedSignature = crypto.createHash('md5')
      .update(`${merchantId}${orderId}${amount}${currency}${statusCode}${hashedSecret}`)
      .digest('hex').toUpperCase();

    const provided = Buffer.from(providedSignature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return { received: false, reason: 'invalid_signature' };
    }

    const db = this.firebaseService.getDb();
    const orderQuery = await db.collection('CustomerOrders').where('orderId', '==', orderId).limit(1).get();
    if (orderQuery.empty) return { received: false, reason: 'order_not_found' };
    const orderRef = orderQuery.docs[0].ref;
    const status = Number(statusCode);

    await db.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      const order = orderSnap.data();
      if (!order || ['paid', 'failed', 'cancelled'].includes(String(order.paymentStatus))) return;
      if (order.paymentMethod !== 'ONLINE') return;
      const paymentMismatch = currency !== (process.env.PAYHERE_CURRENCY || 'LKR') ||
        Number(amount).toFixed(2) !== Number(order.totalAmount).toFixed(2);
      if (status === 2 && !paymentMismatch) {
        transaction.update(orderRef, {
          paymentStatus: 'paid',
          orderStatus: 'Processing',
          paymentReference: String(body.payment_id ?? ''),
          paymentUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else if (status < 0 || paymentMismatch) {
        const items = Array.isArray(order.items) ? order.items : [];
        const refs = items.map((item: any) => db.collection('products').doc(String(item.productId)));
        const products = await Promise.all(refs.map((ref: any) => transaction.get(ref)));
        products.forEach((product: any, index: number) => {
          if (product.exists) {
            const item = items[index];
            transaction.update(refs[index], {
              stock: Number(product.data()?.stock ?? 0) + Number(item.quantity ?? 0),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        });
        transaction.update(orderRef, {
          paymentStatus: 'failed',
          orderStatus: paymentMismatch ? 'Payment-Verification-Failed' : 'Payment-Failed',
          stockReserved: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    return { received: true };
  }

  async settlePayment(customerOrderId: string) {
    const db = this.firebaseService.getDb();
    const ref = db.collection('CustomerOrders').doc(customerOrderId);
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new NotFoundException('Order not found');
      const order = snap.data();
      if (!['COD', 'WHATSAPP'].includes(String(order?.paymentMethod))) {
        throw new BadRequestException('Manual settlement is only available for COD or WhatsApp orders');
      }
      if (order?.paymentStatus !== 'pending' || ['Cancelled', 'Payment-Cancelled'].includes(String(order.orderStatus))) {
        throw new BadRequestException('Only pending orders can be settled');
      }
      transaction.update(ref, {
        paymentStatus: 'paid',
        orderStatus: 'Processing',
        paymentSettledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return { success: true };
  }
}
