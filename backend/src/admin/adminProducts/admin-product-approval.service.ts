// admin-product-approval.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service.js';
import { CountersService } from '../../shared/counters/counters.service.js';
import { Timestamp } from 'firebase-admin/firestore';
import { MailService } from '../../shared/mail/mail.service.js';

@Injectable()
export class AdminProductApprovalService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly countersService: CountersService,
    private readonly mailService: MailService,
  ) {}

  // ── GET /admin/pending-products
  async getAllPending() {
    const db = this.firebaseService.getDb();

    const snapshot = await db
      .collection('pendingProducts')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt ? { _seconds: data.createdAt.seconds } : null,
        approvedAt: data.approvedAt
          ? { _seconds: data.approvedAt.seconds }
          : null,
        rejectedAt: data.rejectedAt
          ? { _seconds: data.rejectedAt.seconds }
          : null,
      };
    });
  }

  // ── PATCH /admin/pending-products/:id/approve
  async approveProduct(pendingProductId: string) {
    const db = this.firebaseService.getDb();

    const pendingRef = db.collection('pendingProducts').doc(pendingProductId);
    const pendingSnap = await pendingRef.get();

    if (!pendingSnap.exists) {
      throw new NotFoundException('Pending product not found');
    }

    const data = pendingSnap.data()!;
    const productCode = await this.countersService.generateProductCode();

    const suppliedStock = data.stock ?? 0;
    const remainingStock = data.minStock ?? 0;

    const productPayload = {
      productName: data.productName,
      productCode,
      category: data.category,
      wholesalePrice: data.wholesalePrice,
      stock: suppliedStock,
      minStock: remainingStock,
      description: data.description || '',
      manufacturer: data.manufacturer || '',
      availability: suppliedStock > 0 ? 'in stock' : 'out of stock',
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add to live products collection
    const productRef = await db.collection('products').add(productPayload);

    // Add to adminProducts collection
    await db.collection('adminProducts').add({
      productId: productRef.id,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      productName: data.productName,
      productCode,
      category: data.category,
      wholesalePrice: data.wholesalePrice,
      retailPrice: (data.wholesalePrice ?? 0) * 1.2,
      stock: suppliedStock,
      minStock: remainingStock,
      description: data.description || '',
      manufacturer: data.manufacturer || '',
      availability: suppliedStock > 0 ? 'in stock' : 'out of stock',
      lastRestocked: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update pendingProducts doc — supplier's onSnapshot fires here automatically
    await pendingRef.update({
      status: 'approved',
      approvedAt: Timestamp.now(),
      productCode,
      productId: productRef.id,
    });

    // Notify supplier
    await db.collection('notifications').add({
      type: 'PRODUCT_APPROVED',
      recipientId: data.supplierId,
      recipientType: 'supplier',
      supplierId: data.supplierId,
      pendingProductId,
      productName: data.productName,
      productCode,
      message: `Your product "${data.productName}" (${productCode}) has been approved and added to the inventory.`,
      read: false,
      createdAt: Timestamp.now(),
    });

    // ✅ Fixed: use data.supplierEmail for the `to` field
    if (data.supplierEmail) {
      await this.mailService.sendProductApprovedEmail({
        to: data.supplierEmail,
        supplierName: data.supplierName,
        productName: data.productName,
        productCode,
      });
    } else {
      console.warn(
        `[ApproveProduct] No supplierEmail found for supplierId: ${data.supplierId}. Email not sent.`,
      );
    }

    return { success: true, productId: productRef.id, productCode };
  }

  // ── PATCH /admin/pending-products/:id/reject
  async rejectProduct(pendingProductId: string, reason?: string) {
    const db = this.firebaseService.getDb();

    const pendingRef = db.collection('pendingProducts').doc(pendingProductId);
    const pendingSnap = await pendingRef.get();

    if (!pendingSnap.exists) {
      throw new NotFoundException('Pending product not found');
    }

    const data = pendingSnap.data()!;

    // Update pendingProducts doc — supplier's onSnapshot fires here automatically
    await pendingRef.update({
      status: 'rejected',
      rejectedAt: Timestamp.now(),
      rejectionReason: reason || '',
    });

    // Notify supplier
    await db.collection('notifications').add({
      type: 'PRODUCT_REJECTED',
      recipientId: data.supplierId,
      recipientType: 'supplier',
      supplierId: data.supplierId,
      pendingProductId,
      productName: data.productName,
      rejectionReason: reason || '',
      message: `Your product "${data.productName}" was not approved.${reason ? ' Reason: ' + reason : ''}`,
      read: false,
      createdAt: Timestamp.now(),
    });

    // ✅ Fixed: use data.supplierEmail for the `to` field
    if (data.supplierEmail) {
      await this.mailService.sendProductRejectedEmail({
        to: data.supplierEmail,
        supplierName: data.supplierName,
        productName: data.productName,
        reason,
      });
    } else {
      console.warn(
        `[RejectProduct] No supplierEmail found for supplierId: ${data.supplierId}. Email not sent.`,
      );
    }

    return { success: true };
  }
}
