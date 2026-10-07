import { Injectable, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

const VALID_VISIBILITY = ['customer', 'hidden'] as const;
type Visibility = (typeof VALID_VISIBILITY)[number];
const ELECTRONICS_CATEGORIES = new Set([
  'smartphones', 'laptops', 'tablets', 'wearables', 'audio', 'gaming',
  'accessories', 'smarthome', 'chargers', 'cables', 'powerbanks', 'electronics', 'computers',
]);

@Injectable()
export class ProductsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private normalizeProduct(doc: FirebaseFirestore.QueryDocumentSnapshot) {
    const data = doc.data() as Record<string, any>;
    const price = Number(data.price ?? data.retailPrice ?? data.wholesalePrice ?? 0);
    const stock = Number(data.stock ?? 0);
    const images = Array.isArray(data.images)
      ? data.images
      : data.imageUrl
        ? [data.imageUrl]
        : [];
    const name = data.name ?? data.productName ?? 'Untitled product';

    return {
      id: doc.id,
      ...data,
      name,
      productName: data.productName ?? name,
      brand: data.brand ?? data.manufacturer ?? 'NEXORA',
      category: data.category ?? 'General',
      price: Number.isFinite(price) ? price : 0,
      stock: Number.isFinite(stock) ? stock : 0,
      description: data.description ?? '',
      imageUrl: data.imageUrl ?? images[0] ?? '',
      images,
      status: data.status ?? 'active',
      warranty: data.warranty ?? '1 year',
      createdAt: data.createdAt ?? null,
    };
  }

  async getProducts(category?: string) {
    const products = await this.getCustomerProducts();
    if (!category || category === 'all') return products;
    const categoryKey = this.normalizeCategory(category);
    return products.filter((product) => this.normalizeCategory(product.category) === categoryKey);
  }

  async searchProducts(searchTerm: string) {
    const term = String(searchTerm ?? '').trim().toLowerCase();
    if (!term) return { results: [], total: 0 };
    const products = await this.getCustomerProducts();
    const results = products.filter((product) =>
      [product.name, product.brand, product.category, product.description]
        .some((value) => String(value ?? '').toLowerCase().includes(term)),
    );
    return { results, total: results.length, query: term };
  }

  async getCategories() {
    const snapshot = await this.firebaseService.getDb().collection('categories')
      .where('domain', '==', 'electronics')
      .get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, any>))
      .filter((category) => category.status !== 'archived')
      .sort((left: any, right: any) => String(left.name).localeCompare(String(right.name)));
  }

  async getFeaturedProducts() {
    const db = this.firebaseService.getDb();
    const products = await this.getCustomerProducts();
    const orderSnapshot = await db.collection('CustomerOrders')
      .where('paymentStatus', '==', 'paid')
      .limit(100)
      .get();
    const quantities = new Map<string, number>();
    orderSnapshot.docs.forEach((order) => {
      const data = order.data();
      const items = Array.isArray(data.items) ? data.items : Array.isArray(data.types) ? data.types : [];
      items.forEach((item: any) => {
        const productId = String(item.productId ?? item.id ?? '');
        if (productId) quantities.set(productId, (quantities.get(productId) ?? 0) + Number(item.quantity ?? item.qty ?? 0));
      });
    });
    return products
      .map((product) => ({ ...product, unitsSold: quantities.get(product.id) ?? 0 }))
      .sort((a, b) => b.unitsSold - a.unitsSold || this.timestampValue(b.createdAt) - this.timestampValue(a.createdAt))
      .slice(0, 6);
  }

  private timestampValue(value: any) {
    if (typeof value === 'number') return value;
    if (value?.seconds) return value.seconds;
    const parsed = Date.parse(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async getProduct(id: string) {
    const product = await this.findProductDoc(id);
    if (!product?.exists) return null;
    const data = this.normalizeProduct(product as FirebaseFirestore.QueryDocumentSnapshot);
    if (['archived', 'hidden', 'draft', 'inactive'].includes(String(data.status).toLowerCase())) return null;
    if (!(await this.isElectronicsCategory(data.category))) return null;
    return data;
  }

  private async findProductDoc(productCode: string) {
    const db = this.firebaseService.getDb();

    if (!productCode?.trim()) return null;

    const codeSnap = await db
      .collection('products')
      .where('productCode', '==', productCode)
      .get();
    if (!codeSnap.empty) return codeSnap.docs[0];

    const directDoc = await db.collection('products').doc(productCode).get();
    if (directDoc.exists) return directDoc;

    return null;
  }

  async getProductCategory(productCode: string) {
    const productDoc = await this.findProductDoc(productCode);
    if (!productDoc || !productDoc.exists) return '';
    return String(productDoc.data()?.category || '');
  }

  private async updateAdminProductStock(
    productDocId: string,
    quantity: number,
  ) {
    const db = this.firebaseService.getDb();
    const adminSnap = await db
      .collection('adminProducts')
      .where('productId', '==', productDocId)
      .get();

    if (!adminSnap.empty) {
      const adminStock = adminSnap.docs[0].data().stock ?? 0;
      await adminSnap.docs[0].ref.update({
        stock: Math.max(0, Number(adminStock) + quantity),
      });
    }
  }

  async decrementStock(productCode: string, quantity: number) {
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return { success: false, message: 'Invalid quantity' };
    }

    const db = this.firebaseService.getDb();
    const productDoc = await this.findProductDoc(productCode);
    if (!productDoc) {
      return { success: false, message: 'Product not found' };
    }

    let before = 0;
    let after = 0;
    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(productDoc.ref);
      before = Number(docSnap.data()?.stock ?? 0);
      after = Math.max(0, before - quantity);
      transaction.update(productDoc.ref, { stock: after });
    });

    await this.updateAdminProductStock(productDoc.id, -quantity);
    return { success: true, productCode, before, after };
  }

  async incrementStock(productCode: string, quantity: number) {
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return { success: false, message: 'Invalid quantity' };
    }

    const db = this.firebaseService.getDb();
    const productDoc = await this.findProductDoc(productCode);
    if (!productDoc) {
      return { success: false, message: 'Product not found' };
    }

    let before = 0;
    let after = 0;
    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(productDoc.ref);
      before = Number(docSnap.data()?.stock ?? 0);
      after = before + quantity;
      transaction.update(productDoc.ref, { stock: after });
    });

    await this.updateAdminProductStock(productDoc.id, quantity);
    return { success: true, productCode, before, after };
  }

  async getPendingProducts() {
    const db = this.firebaseService.getDb();
    const snapshot = await db.collection('products').get();
    return snapshot.docs.map((doc) => this.normalizeProduct(doc));
  }

  async getAllPharmacistProducts() {
    return this.getCustomerProducts();
  }

  async getCustomerProducts() {
    const db = this.firebaseService.getDb();

    try {
      const categorySnapshot = await db.collection('categories').where('domain', '==', 'electronics').get();
      const managedCategories = new Set(categorySnapshot.docs
        .filter((doc) => doc.data().status !== 'archived')
        .map((doc) => this.normalizeCategory(doc.data().name)));
      const queryRef: FirebaseFirestore.Query = db.collection('products');
      const snapshot = await queryRef.get();
      return snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          const categoryKey = this.normalizeCategory(data.category);
          return !['archived', 'hidden', 'draft', 'inactive'].includes(String(data.status || 'active').toLowerCase())
            && (ELECTRONICS_CATEGORIES.has(categoryKey) || managedCategories.has(categoryKey));
        })
        .map((doc) => this.normalizeProduct(doc));
    } catch (err) {
      console.error('getCustomerProducts ERROR:', err);
      throw err;
    }
  }

  private normalizeCategory(value: unknown) {
    return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private async isElectronicsCategory(category: unknown) {
    const categoryKey = this.normalizeCategory(category);
    if (ELECTRONICS_CATEGORIES.has(categoryKey)) return true;
    const snapshot = await this.firebaseService.getDb().collection('categories').where('domain', '==', 'electronics').get();
    return snapshot.docs.some((doc) => doc.data().status !== 'archived' && this.normalizeCategory(doc.data().name) === categoryKey);
  }

  isStorefrontCategory(category: unknown) {
    return this.isElectronicsCategory(category);
  }

  async approvePending(id: string) {
    const db = this.firebaseService.getDb();
    await db.collection('products').doc(id).update({
      status: 'active',
      approvedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id };
  }

  async addProduct(body: any) {
    const db = this.firebaseService.getDb();

    const visibility: Visibility = VALID_VISIBILITY.includes(body.visibility)
      ? body.visibility
      : 'customer';

    const docRef = await db.collection('products').add({
      name: body.name ?? body.productName ?? 'New product',
      productName: body.productName ?? body.name ?? 'New product',
      price: Number(body.price ?? 0),
      retailPrice: Number(body.price ?? 0),
      description: body.description ?? '',
      imageUrl: body.imageUrl ?? '',
      images: Array.isArray(body.images) ? body.images : body.imageUrl ? [body.imageUrl] : [],
      category: body.category ?? 'General',
      brand: body.brand ?? body.manufacturer ?? 'NEXORA',
      manufacturer: body.manufacturer ?? body.brand ?? 'NEXORA',
      stock: Number(body.stock ?? 0),
      visibility,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, id: docRef.id, visibility };
  }

  async updateVisibility(id: string, visibility: string) {
    if (!VALID_VISIBILITY.includes(visibility as Visibility)) {
      throw new BadRequestException(
        `Invalid visibility. Must be one of: ${VALID_VISIBILITY.join(', ')}`,
      );
    }

    const db = this.firebaseService.getDb();
    await db.collection('products').doc(id).update({
      visibility,
      status: visibility === 'customer' ? 'active' : 'hidden',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, id, visibility };
  }
}
