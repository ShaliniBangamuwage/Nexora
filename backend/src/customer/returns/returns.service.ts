import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class ReturnsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getReturns() {
    const db = this.firebaseService.getDb();
    const snapshot = await db
      .collection('CustomerReturns')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async submitReturn(body: any, userId: string) {
    const db = this.firebaseService.getDb();
      let orderSnapshot = await db.collection('CustomerOrders').doc(String(body.orderId ?? '')).get();
      if (!orderSnapshot.exists) {
        const match = await db.collection('CustomerOrders').where('orderId', '==', body.orderId).limit(1).get();
        if (match.empty) throw new NotFoundException('Order not found');
        orderSnapshot = match.docs[0] as FirebaseFirestore.DocumentSnapshot;
      }
      const order = orderSnapshot.data();
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('You cannot return another customer order');
    if (String(order.orderStatus).toLowerCase() !== 'delivered') throw new BadRequestException('Only delivered orders can be returned');
    if (!Array.isArray(body.items) || body.items.length === 0) throw new BadRequestException('Select at least one item to return');
    const orderedItems = Array.isArray(order.items) ? order.items : Array.isArray(order.types) ? order.types : [];
    const approvedItems = body.items.map((requested: any) => {
      const original = orderedItems.find((item: any) => String(item.productId ?? item.id) === String(requested.productId ?? requested.id) || item.name === requested.name);
      const quantity = Number(requested.quantity);
      if (!original || !Number.isInteger(quantity) || quantity < 1 || quantity > Number(original.quantity ?? original.qty ?? 0)) {
        throw new BadRequestException('Return items or quantities do not match the delivered order');
      }
      return {
        productId: original.productId ?? original.id,
        name: original.name,
        price: Number(original.price ?? 0),
        quantity,
        reason: String(requested.reason ?? ''),
      };
    });
    const refundAmount = approvedItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const docRef = await db.collection('CustomerReturns').add({
      userId,
        orderId: order.orderId ?? orderSnapshot.id,
      customerName: order.customerName || null,
      phone: order.phone || null,
      address: order.address || null,
      items: approvedItems,
      refundAmount,
      adjustmentNote: body.adjustmentNote || null,
      returnStatus: 'pending',
      refundStatus: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      processedAt: null,
    });
    return { success: true, id: docRef.id };
  }
}
