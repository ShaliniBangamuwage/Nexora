import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service.js';
import { v2 as cloudinary } from 'cloudinary';

const CATALOG_FIELDS = ['name', 'brand', 'category', 'description', 'price', 'stock', 'images', 'specifications', 'warranty', 'status'] as const;
const VALID_STATUS = ['active', 'draft', 'archived', 'out_of_stock'] as const;

@Injectable()
export class AdminCatalogService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private validateProduct(input: Record<string, any>, partial = false) {
    const product: Record<string, any> = {};
    for (const field of CATALOG_FIELDS) {
      if (input[field] !== undefined) product[field] = input[field];
    }
    if (!partial || product.name !== undefined) {
      product.name = String(product.name ?? '').trim();
      if (!product.name) throw new BadRequestException('Product name is required');
    }
    for (const field of ['brand', 'category'] as const) {
      if (!partial || product[field] !== undefined) {
        product[field] = String(product[field] ?? '').trim();
        if (!product[field]) throw new BadRequestException(`${field} is required`);
      }
    }
    for (const field of ['price', 'stock'] as const) {
      if (!partial || product[field] !== undefined) {
        const value = Number(product[field]);
        if (!Number.isFinite(value) || value < 0 || (field === 'price' && value === 0) || (field === 'stock' && !Number.isInteger(value))) {
          throw new BadRequestException(field === 'price' ? 'price must be a positive number' : 'stock must be a non-negative integer');
        }
        product[field] = value;
      }
    }
    if (product.images !== undefined && (!Array.isArray(product.images) || product.images.some((url: unknown) => typeof url !== 'string'))) {
      throw new BadRequestException('images must be an array of URLs');
    }
    if (product.specifications !== undefined && (product.specifications === null || typeof product.specifications !== 'object')) {
      throw new BadRequestException('specifications must be an object');
    }
    if (product.status !== undefined && !VALID_STATUS.includes(product.status)) {
      throw new BadRequestException(`status must be one of: ${VALID_STATUS.join(', ')}`);
    }
    if (product.price !== undefined) product.price = Number(product.price);
    if (product.stock !== undefined) product.stock = Number(product.stock);
    if (product.images) product.imageUrl = product.images[0] ?? '';
    if (product.price !== undefined) product.retailPrice = product.price;
    if (product.status === 'out_of_stock') product.stock = 0;
    return product;
  }

  async listProducts() {
    const snapshot = await this.firebaseService.getDb().collection('products').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async createProduct(input: Record<string, any>) {
    const product = this.validateProduct(input);
    const now = new Date().toISOString();
    const ref = await this.firebaseService.getDb().collection('products').add({
      ...product,
      productName: product.name,
      imageUrl: product.images?.[0] ?? '',
      status: product.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    });
    return { id: ref.id, ...product, productName: product.name, status: product.status ?? 'active' };
  }

  async updateProduct(id: string, input: Record<string, any>) {
    const ref = this.firebaseService.getDb().collection('products').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Product not found');
    const product = this.validateProduct(input, true);
    if (!Object.keys(product).length) throw new BadRequestException('No product fields supplied');
    await ref.update({
      ...product,
      ...(product.name !== undefined ? { productName: product.name } : {}),
      ...(product.images !== undefined ? { imageUrl: product.images[0] ?? '' } : {}),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id };
  }

  async archiveProduct(id: string) {
    const ref = this.firebaseService.getDb().collection('products').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Product not found');
    await ref.update({ status: 'archived', updatedAt: new Date().toISOString() });
    return { success: true, id, status: 'archived' };
  }

  async updateStock(id: string, stock: number) {
    if (!Number.isInteger(stock) || stock < 0) throw new BadRequestException('stock must be a non-negative integer');
    const ref = this.firebaseService.getDb().collection('products').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Product not found');
    const status = stock === 0 ? 'out_of_stock' : (snap.data()?.status === 'out_of_stock' ? 'active' : snap.data()?.status);
    await ref.update({ stock, status, updatedAt: new Date().toISOString() });
    return { success: true, id, stock, status };
  }

  async uploadProductImage(file: Express.Multer.File) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Cloudinary credentials are not configured');
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'nexora/products', resource_type: 'image' }, (error, uploaded) => {
        if (error || !uploaded) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
      }).end(file.buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  async listTaxonomy(collection: 'categories' | 'brands') {
    const snapshot = await this.firebaseService.getDb().collection(collection).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async createTaxonomy(collection: 'categories' | 'brands', name: string) {
    const normalizedName = String(name ?? '').trim();
    if (!normalizedName) throw new BadRequestException('Name is required');
    const db = this.firebaseService.getDb();
    const existing = await db.collection(collection).where('name', '==', normalizedName).limit(1).get();
    if (!existing.empty) throw new BadRequestException(`${collection.slice(0, -1)} already exists`);
    const slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const ref = db.collection(collection).doc(`${slug}-${Date.now().toString(36)}`);
    await ref.set({ name: normalizedName, slug, domain: 'electronics', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return { id: ref.id, name: normalizedName, slug, status: 'active' };
  }

  async updateTaxonomy(collection: 'categories' | 'brands', id: string, name: string) {
    const normalizedName = String(name ?? '').trim();
    if (!normalizedName) throw new BadRequestException('Name is required');
    const ref = this.firebaseService.getDb().collection(collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException(`${collection.slice(0, -1)} not found`);
    const previousName = String(snap.data()?.name ?? '');
    const slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await ref.update({ name: normalizedName, slug, domain: 'electronics', updatedAt: new Date().toISOString() });
    const field = collection === 'categories' ? 'category' : 'brand';
    const products = await this.firebaseService.getDb().collection('products').where(field, '==', previousName).get();
    for (let start = 0; start < products.docs.length; start += 450) {
      const batch = this.firebaseService.getDb().batch();
      products.docs.slice(start, start + 450).forEach((product) => {
        batch.update(product.ref, {
          [field]: normalizedName,
          ...(collection === 'brands' ? { manufacturer: normalizedName } : {}),
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
    return { success: true, id, name: normalizedName, slug };
  }

  async archiveTaxonomy(collection: 'categories' | 'brands', id: string) {
    const ref = this.firebaseService.getDb().collection(collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException(`${collection.slice(0, -1)} not found`);
    await ref.update({ status: 'archived', updatedAt: new Date().toISOString() });
    return { success: true, id, status: 'archived' };
  }
}
