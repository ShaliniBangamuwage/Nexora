import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class NotificationsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private get db() {
    return this.firebaseService.getDb();
  }

  // ─── GET all notifications for recipientType ───────────────────
  async getNotifications(recipientType: string = 'admin') {
    const snapshot = await this.db
      .collection('notifications')
      .where('recipientType', '==', recipientType)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // ─── POST create ORDER_SHIPPED notification (supplier marks In Delivery) ───
  async createOrderShippedNotification(data: {
    orderId: string;
    poId: string;
    supplierName?: string;
    courier?: string;
    trackingNumber: string;
    trackingUrl?: string;
  }) {
    await this.db.collection('notifications').add({
      recipientType: 'admin',
      type: 'ORDER_SHIPPED',
      read: false,
      orderId: data.orderId,
      poId: data.poId,
      supplierName: data.supplierName || null,
      courier: data.courier || null,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl || null,
      message: `Order ${data.poId} has been picked by ${data.courier || 'the courier'}.`,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Shipment notification created' };
  }

  // ─── PATCH mark single notification as read ────────────────────
  async markAsRead(notificationId: string) {
    const ref = this.db.collection('notifications').doc(notificationId);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new NotFoundException('Notification not found');
    }

    await ref.update({ read: true });
    return { success: true, message: 'Notification marked as read' };
  }

  // ─── PATCH mark ALL notifications as read ─────────────────────
  async markAllAsRead() {
    const snapshot = await this.db
      .collection('notifications')
      .where('recipientType', '==', 'admin')
      .where('read', '==', false)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();

    return {
      success: true,
      message: `${snapshot.size} notifications marked as read`,
    };
  }

  // ─── PATCH mark order as received (ORDER_APPROVED action) ─────
  async markOrderAsReceived(notificationId: string) {
    // 1. Get notification
    const notifRef = this.db.collection('notifications').doc(notificationId);
    const notifSnap = await notifRef.get();

    if (!notifSnap.exists) {
      throw new NotFoundException('Notification not found');
    }

    const notification = notifSnap.data()!;

    // 2. Get purchase order
    const orderRef = this.db
      .collection('purchaseOrders')
      .doc(notification.orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new NotFoundException('Order not found');
    }

    const order = orderSnap.data()!;

    // 3. Validate order status
    if (order.status !== 'APPROVED') {
      throw new BadRequestException(
        'Order must be APPROVED before marking as received',
      );
    }

    // 4. Update purchase order to COMPLETED
    await orderRef.update({
      status: 'COMPLETED',
      completionDate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 5. Update adminProduct stock
    const adminProductRef = this.db
      .collection('adminProducts')
      .doc(order.adminProductId);
    const adminProductSnap = await adminProductRef.get();

    if (adminProductSnap.exists) {
      const adminProduct = adminProductSnap.data()!;
      await adminProductRef.update({
        stock: (adminProduct.stock || 0) + order.quantity,
        availability: 'in stock',
        lastRestocked: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 6. Mark notification as read
    await notifRef.update({ read: true });

    return {
      success: true,
      message: 'Order marked as received. Inventory has been updated.',
    };
  }

  // ─── DELETE notification ───────────────────────────────────────
  async deleteNotification(notificationId: string) {
    const ref = this.db.collection('notifications').doc(notificationId);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new NotFoundException('Notification not found');
    }

    await ref.delete();
    return { success: true, message: 'Notification deleted' };
  }
}
