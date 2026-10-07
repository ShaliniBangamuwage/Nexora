import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly productsService: ProductsService,
  ) {}

  private async getProduct(productKey: string) {
    const db = this.firebaseService.getDb();
    let product = await db.collection('products').doc(productKey).get();
    if (!product.exists) {
      const match = await db.collection('products').where('productCode', '==', productKey).limit(1).get();
      if (match.empty) throw new NotFoundException('Product is no longer available');
      product = match.docs[0];
    }
    return product;
  }

  async getCart(customerId: string, authenticatedUserId: string) {
    if (customerId !== authenticatedUserId) throw new ForbiddenException('You cannot access another customer cart');
    const snapshot = await this.firebaseService.getDb().collection('cart').where('customerId', '==', authenticatedUserId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async addItem(body: any) {
    const db = this.firebaseService.getDb();
    const productKey = String(body.productId ?? '').trim();
    const quantity = Number(body.qty ?? 1);
    if (!productKey || !Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('A product and positive integer quantity are required');
    }
    const product = await this.getProduct(productKey);
    const productData = product.data()!;
    if (!(await this.productsService.isStorefrontCategory(productData.category))) {
      throw new NotFoundException('Product is not part of the electronics catalog');
    }
    if (['archived', 'hidden', 'draft', 'inactive', 'out_of_stock'].includes(String(productData.status ?? '').toLowerCase())) {
      throw new BadRequestException('Product is unavailable');
    }
    const productId = product.id;
    const stock = Number(productData.stock ?? 0);
    const existingSnapshot = await db.collection('cart')
      .where('customerId', '==', body.customerId)
      .where('productId', '==', productId)
      .get();
    const existingQty = existingSnapshot.docs.reduce((sum, doc) => sum + Number(doc.data().qty ?? 0), 0);
    if (existingQty + quantity > stock) throw new BadRequestException('Requested quantity exceeds available stock');

    if (!existingSnapshot.empty) {
      const keep = existingSnapshot.docs[0];
      const nextQty = existingQty + quantity;
      const batch = db.batch();
      batch.update(keep.ref, { qty: nextQty, price: Number(productData.price ?? productData.retailPrice ?? 0) });
      existingSnapshot.docs.slice(1).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      return { id: keep.id, customerId: body.customerId, productId, stockId: productId, name: productData.name ?? productData.productName, price: Number(productData.price ?? productData.retailPrice ?? 0), imageUrl: productData.imageUrl ?? productData.images?.[0] ?? '', category: productData.category ?? '', qty: nextQty };
    }

    const item = {
      customerId: body.customerId,
      productId,
      stockId: productId,
      name: String(productData.name ?? productData.productName ?? 'Product'),
      price: Number(productData.price ?? productData.retailPrice ?? 0),
      imageUrl: String(productData.imageUrl ?? productData.images?.[0] ?? ''),
      category: String(productData.category ?? ''),
      qty: quantity,
    };
    const ref = await db.collection('cart').add(item);
    return { id: ref.id, ...item };
  }

  async updateQty(id: string, qty: number, authenticatedUserId: string) {
    if (!Number.isInteger(Number(qty)) || Number(qty) < 0) throw new BadRequestException('Quantity must be a non-negative integer');
    const db = this.firebaseService.getDb();
    const ref = db.collection('cart').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Cart item not found');
    const item = snap.data()!;
    if (item.customerId !== authenticatedUserId) throw new ForbiddenException('You cannot modify another customer cart');
    if (Number(qty) === 0) {
      await ref.delete();
      return { success: true, id };
    }
    const product = await this.getProduct(String(item.productId));
    if (Number(qty) > Number(product.data()?.stock ?? 0)) throw new BadRequestException('Requested quantity exceeds available stock');
    await ref.update({ qty: Number(qty) });
    return { id, ...item, qty: Number(qty) };
  }

  async removeItem(id: string, authenticatedUserId: string) {
    const ref = this.firebaseService.getDb().collection('cart').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Cart item not found');
    if (snap.data()?.customerId !== authenticatedUserId) throw new ForbiddenException('You cannot modify another customer cart');
    await ref.delete();
    return { success: true, id };
  }

  async clearCart(customerId: string, authenticatedUserId: string) {
    if (customerId !== authenticatedUserId) throw new ForbiddenException('You cannot clear another customer cart');
    const db = this.firebaseService.getDb();
    const snapshot = await db.collection('cart').where('customerId', '==', authenticatedUserId).get();
    if (snapshot.empty) return { success: true };
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return { success: true };
  }
}
