import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service.js';
import { InternalServerErrorException } from '@nestjs/common';

const ORDERS_COLLECTION = 'CustomerOrders';

@Injectable()
export class OrdersService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getAllOrders() {
    const db = this.firebaseService.getDb();
    try {
      const snapshot = await db
        .collection(ORDERS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn('orderBy failed, falling back to full fetch:', err.message);
      const snapshot = await db.collection(ORDERS_COLLECTION).get();
      const allDocs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as any[];
      return allDocs.sort((a, b) => {
        const aTime = a.createdAt?._seconds ?? a.createdAt?.seconds ?? 0;
        const bTime = b.createdAt?._seconds ?? b.createdAt?.seconds ?? 0;
        return bTime - aTime;
      });
    }
  }

  async getOrderById(id: string) {
    const db = this.firebaseService.getDb();
    const docSnap = await db.collection(ORDERS_COLLECTION).doc(id).get();
    if (!docSnap.exists) throw new NotFoundException('Order not found');
    return { id: docSnap.id, ...docSnap.data() };
  }

  async updateOrderStatus(id: string, orderStatus: string) {
    const allowedStatuses = ['Pending-Payment', 'Pending-COD', 'Pending-WhatsApp-Confirmation', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Payment-Failed'];
    if (!allowedStatuses.includes(orderStatus)) throw new BadRequestException('Unsupported order status');
    const ref = this.firebaseService.getDb().collection(ORDERS_COLLECTION).doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new NotFoundException('Order not found');
    await this.firebaseService.getDb().runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(ref);
      const order = orderSnap.data();
      if (!order) throw new NotFoundException('Order not found');
      if (orderStatus === 'Cancelled' && order.paymentStatus === 'paid') {
        throw new BadRequestException('Paid orders require a refund workflow before cancellation');
      }
      if (
        ['Processing', 'Shipped', 'Delivered'].includes(orderStatus) &&
        order.paymentMethod === 'ONLINE' &&
        order.paymentStatus !== 'paid'
      ) {
        throw new BadRequestException('Online orders must be paid before fulfillment');
      }
      if (orderStatus === 'Cancelled' && order.stockReserved) {
        const items = Array.isArray(order.items) ? order.items : [];
        const productRefs = items.map((item: any) => this.firebaseService.getDb().collection('products').doc(String(item.productId)));
        const productSnaps = await Promise.all(productRefs.map((productRef: any) => transaction.get(productRef)));
        productSnaps.forEach((productSnap: any, index: number) => {
          if (productSnap.exists) {
            transaction.update(productRefs[index], {
              stock: Number(productSnap.data()?.stock ?? 0) + Number(items[index].quantity ?? 0),
              updatedAt: new Date().toISOString(),
            });
          }
        });
        transaction.update(ref, {
          orderStatus,
          paymentStatus: 'cancelled',
          stockReserved: false,
          updatedAt: new Date().toISOString(),
        });
        return;
      }
      transaction.update(ref, { orderStatus, updatedAt: new Date().toISOString() });
    });
    return { success: true, id, orderStatus };
  }

  async createOrder(orderPayload: any) {
    try {
      const db = this.firebaseService.getDb();
      const currentTimestamp = new Date().toISOString();

      const orderData = {
        ...orderPayload,
        date: currentTimestamp,
        createdAt: currentTimestamp,
      };

      const docRef = await db.collection(ORDERS_COLLECTION).add(orderData);

      return {
        id: docRef.id,
        ...orderData,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Order creation failed: ${error.message}`,
      );
    }
  }
}