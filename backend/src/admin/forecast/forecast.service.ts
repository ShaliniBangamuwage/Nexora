import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import OpenAI from 'openai';

interface OrderType {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CustomerOrder {
  id: string;
  createdAt: FirebaseFirestore.Timestamp;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  totalAmount: number;
  items?: OrderType[];
  types?: OrderType[];
}

interface ProductDoc {
  id: string;
  productName: string;
  productCode: string;
  stock: number;
  minStock: number;
  category: string;
  availability: string;
  wholesalePrice: number;
  supplierId: string;
  supplierName: string;
  expireDate?: FirebaseFirestore.Timestamp | null;
}

export interface ForecastResult {
  productId: string;
  productName: string;
  productCode: string;
  category: string;
  stock: number;
  minStock: number;
  supplierName: string;
  totalSold: number;
  dailyAvg: number;
  forecast7d: number;
  forecast30d: number;
  risk: 'High' | 'Medium' | 'Low';
  daysUntilStockout: number | null;
  dailySales: number[];
  isExpired: boolean;
}

export interface AiInsightResult {
  insight: string;
  source: 'ai' | 'fallback';
}

const COMPLETED_STATUSES = ['Paid', 'paid', 'PAID', 'delivered', 'completed'];

// Keep this in sync with AiAnalyticsService's GROQ_MODEL default so both
// services move together if Groq deprecates the model again.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

@Injectable()
export class ForecastService {
  private readonly logger = new Logger(ForecastService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async getForecast(): Promise<ForecastResult[]> {
    const [orders, products] = await Promise.all([
      this.fetchCompletedOrders(),
      this.fetchProducts(),
    ]);

    const salesMap = this.aggregateSalesByProductId(orders);
    const now = new Date();

    return products.map((product) => {
      const sales = salesMap.get(product.id) ?? {
        totalSold: 0,
        dailySales: new Array(7).fill(0),
      };

      const { forecast7d, forecast30d, dailyAvg } = this.predictDemand(sales.dailySales);

      const risk = this.calculateStockRisk(product.stock, forecast7d, product.minStock);

      const daysUntilStockout =
        dailyAvg > 0 ? Math.floor(product.stock / dailyAvg) : null;

      const isExpired = product.expireDate
        ? product.expireDate.toDate() < now
        : false;

      return {
        productId: product.id,
        productName: product.productName,
        productCode: product.productCode,
        category: product.category,
        stock: product.stock,
        minStock: product.minStock,
        supplierName: product.supplierName,
        totalSold: sales.totalSold,
        dailyAvg: Math.round(dailyAvg),
        forecast7d,
        forecast30d,
        risk,
        daysUntilStockout,
        dailySales: sales.dailySales,
        isExpired,
      };
    });
  }

  async saveForecastSnapshot(): Promise<void> {
    const db = this.firebaseService.getDb();
    const results = await this.getForecast();
    const batch = db.batch();
    const today = new Date().toISOString().split('T')[0];

    for (const item of results) {
      const ref = db.collection('salesForecasts').doc(`${today}_${item.productId}`);
      batch.set(ref, { ...item, generatedAt: new Date() });
    }

    await batch.commit();
  }

  private async fetchCompletedOrders(): Promise<CustomerOrder[]> {
    const db = this.firebaseService.getDb();

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const snapshot = await db
      .collection('CustomerOrders')
      .where('createdAt', '>=', since)
      .get();

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as CustomerOrder))
      .filter(
        (order) =>
          COMPLETED_STATUSES.includes(order.orderStatus ?? '') ||
          COMPLETED_STATUSES.includes(order.paymentStatus ?? ''),
      );
  }

  private async fetchProducts(): Promise<ProductDoc[]> {
    const db = this.firebaseService.getDb();
    const snapshot = await db.collection('products').get();

    return snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        productName: d.productName ?? '',
        productCode: d.productCode ?? '',
        stock: d.stock ?? 0,
        minStock: d.minStock ?? 0,
        category: d.category ?? '',
        availability: d.availability ?? '',
        wholesalePrice: d.wholesalePrice ?? 0,
        supplierId: d.supplierId ?? '',
        supplierName: d.supplierName ?? '',
        expireDate: d.expireDate ?? null,
      };
    });
  }

  private aggregateSalesByProductId(
    orders: CustomerOrder[],
  ): Map<string, { totalSold: number; dailySales: number[] }> {
    const map = new Map<string, { totalSold: number; dailySales: number[] }>();
    const now = Date.now();
    const MS_PER_DAY = 86400000;

    for (const order of orders) {
      const orderDate = order.createdAt?.toDate?.() ?? new Date();
      const daysAgo = Math.floor((now - orderDate.getTime()) / MS_PER_DAY);
      const slotIndex = 6 - daysAgo;
      const items = order.items ?? order.types ?? [];

      for (const item of items) {
        if (!item.id) continue;

        const qty = item.quantity ?? 1;

        if (!map.has(item.id)) {
          map.set(item.id, { totalSold: 0, dailySales: new Array(7).fill(0) });
        }

        const entry = map.get(item.id)!;
        entry.totalSold += qty;

        if (slotIndex >= 0 && slotIndex <= 6) {
          entry.dailySales[slotIndex] += qty;
        }
      }
    }

    return map;
  }

  private predictDemand(dailySales: number[]) {
    const total = dailySales.reduce((sum, n) => sum + n, 0);
    const dailyAvg = total / 7;

    return {
      dailyAvg,
      forecast7d: Math.ceil(dailyAvg * 7),
      forecast30d: Math.ceil(dailyAvg * 30),
    };
  }

  private calculateStockRisk(
    stock: number,
    forecast7d: number,
    minStock: number,
  ): 'High' | 'Medium' | 'Low' {
    if (stock <= 0) return 'High';
    if (stock < minStock) return 'High';
    if (stock < forecast7d) return 'Medium';
    return 'Low';
  }

  private generateFallbackInsight(product: ForecastResult): string {
    if (product.isExpired) {
      return 'This product has expired. Remove it from inventory and avoid further sales.';
    }
    if (product.risk === 'High') {
      return 'High stock risk detected. Reorder immediately to prevent shortages.';
    }
    if (product.risk === 'Medium') {
      return 'Stock levels are becoming low. Consider replenishing inventory soon.';
    }
    return 'Stock levels are healthy and sufficient for forecasted demand.';
  }

  async getAiInsight(productId: string): Promise<AiInsightResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      this.logger.error('GROQ_API_KEY is not set in environment variables');
      return { insight: 'AI insight unavailable: missing API key.', source: 'fallback' };
    }

    let product: ForecastResult | undefined;
    try {
      const results = await this.getForecast();
      product = results.find((p) => p.productId === productId);
    } catch (err) {
      this.logger.error('getForecast() failed inside getAiInsight', err);
      throw err;
    }

    if (!product) {
      return { insight: 'Product not found.', source: 'fallback' };
    }

    const prompt = `
You are a pharmacy inventory analyst.
Product: ${product.productName}
Current Stock: ${product.stock}
Minimum Stock: ${product.minStock}
Daily Average Sales: ${product.dailyAvg}
Forecast Next 7 Days: ${product.forecast7d}
Forecast Next 30 Days: ${product.forecast30d}
Days Until Stockout: ${product.daysUntilStockout ?? 'Unknown'}
Risk Level: ${product.risk}
Expired: ${product.isExpired}
Provide:
1. A short inventory assessment.
2. A clear recommendation.
Maximum 2 sentences.
`;

    try {
      const client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });

      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      
        max_tokens: 400,
      });

    
      this.logger.debug(
        `Groq raw response for ${productId}: ${JSON.stringify(completion.choices[0])}`,
      );

      const content = completion.choices[0]?.message?.content?.trim();
      const hasContent = !!content && content.length > 0;

      if (!hasContent) {
        this.logger.warn(
          `Groq returned empty content for ${productId} (finish_reason: ${completion.choices[0]?.finish_reason}). Falling back.`,
        );
      }

      return {
       
        insight: hasContent ? content! : this.generateFallbackInsight(product),
        source: hasContent ? 'ai' : 'fallback',
      };
    } catch (err: any) {
      this.logger.error(
        'Groq API call failed',
        err?.response?.data ?? err?.error ?? err?.message ?? err,
      );
      return {
        insight: this.generateFallbackInsight(product),
        source: 'fallback',
      };
    }
  }
}
