/* eslint-disable @typescript-eslint/no-require-imports */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pinecone, Index, RecordMetadata } from '@pinecone-database/pinecone';
import { FirebaseService } from '../../shared/firebase/firebase.service.js';

const { pipeline } = require('@xenova/transformers');

interface Product {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  availability?: string;
  price?: number;
  imageUrl?: string;
  similarityScore: number;
  searchSource: string;
  [key: string]: unknown;
}

interface SearchLog {
  query: string;
  resultsCount: number;
  date: string;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private index?: Index<RecordMetadata>;
  private embedder: any = null;
  private pineconeAvailable = false;

  constructor(private firebaseService: FirebaseService) {}

  async onModuleInit(): Promise<void> {
    const apiKey = process.env.PINECONE_API_KEY?.trim();
    const indexName = process.env.PINECONE_INDEX?.trim();

    if (apiKey && indexName) {
      try {
        this.index = new Pinecone({ apiKey }).index(indexName);
        this.embedder = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
        );
        this.pineconeAvailable = true;
        console.log('✅ Pinecone connected to index:', indexName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Pinecone unavailable; using keyword search only: ${message}`);
        this.index = undefined;
        this.embedder = null;
      }
    } else {
      console.warn('Pinecone credentials or index missing; using keyword search only');
    }

    // Run existing products migration to lowercase names in background
    this.migrateExistingProductsLowercase().catch((err) => {
      console.error('❌ Migration failed to complete:', err);
    });
  }

  private async migrateExistingProductsLowercase(): Promise<void> {
    try {
      const db = this.firebaseService.getDb();
      const batch = db.batch();
      let migratedCount = 0;

      const snapshot = await db.collection('products').get();
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.name && data.nameLowercase === undefined) {
          batch.update(doc.ref, { nameLowercase: data.name.toLowerCase() });
          migratedCount++;
        }
      }

      if (migratedCount > 0) {
        await batch.commit();
        console.log(`✅ Migrated ${migratedCount} existing products to have nameLowercase`);
      } else {
        console.log('✅ No products needed lowercase name migration');
      }
    } catch (error) {
      console.error('❌ Failed to migrate existing products to lowercase name:', error);
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(output.data as number[]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Embedding error:', msg);
      throw new Error('Failed to generate embedding');
    }
  }

  private async vectorSearch(query: string): Promise<Product[]> {
    if (!this.pineconeAvailable || !this.index) return [];

    try {
      const queryVector = await this.getEmbedding(query);
      const pineconeResults = await this.index.query({
        vector: queryVector,
        topK: 10,
        includeMetadata: true,
      });

      if (!pineconeResults.matches?.length) return [];

      const db = this.firebaseService.getDb();
      const results: Product[] = [];

      for (const match of pineconeResults.matches) {
        if (match.score === undefined || match.score < 0.3) continue;
        const doc = await db
          .collection('products')
          .doc(match.id)
          .get();
        if (doc.exists) {
          results.push({
            ...(doc.data() as Product),
            id: doc.id,
            similarityScore: Math.round(match.score * 100),
            searchSource: 'vector',
          });
        }
      }
      return results;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Vector search failed:', msg);
      return [];
    }
  }

  private async keywordSearch(query: string): Promise<Product[]> {
    try {
      const db = this.firebaseService.getDb();

      const lowercaseQuery = query.toLowerCase();
      const snapshot = await db
        .collection('products')
        .where('nameLowercase', '>=', lowercaseQuery)
        .where('nameLowercase', '<=', lowercaseQuery + '\uf8ff')
        .limit(20)
        .get();

      const results = snapshot.docs.map((doc) => ({
          ...(doc.data() as Product),
          id: doc.id,
          similarityScore: 100,
          searchSource: 'keyword',
        }));

      return results;
    } catch (error) {
      console.error('Keyword search failed:', error);
      return [];
    }
  }

  private mergeResults(
    vectorResults: Product[],
    keywordResults: Product[],
  ): Product[] {
    const merged = new Map<string, Product>();
    for (const product of keywordResults) {
      merged.set(product.id, product);
    }
    for (const product of vectorResults) {
      if (!merged.has(product.id)) {
        merged.set(product.id, product);
      }
    }
    return Array.from(merged.values()).sort(
      (a, b) => b.similarityScore - a.similarityScore,
    );
  }

  private async logSearch(query: string, resultsCount: number): Promise<void> {
    const db = this.firebaseService.getDb();
    try {
      await db.collection('searchLogs').add({
        query: query.toLowerCase().trim(),
        resultsCount,
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0],
      });
      console.log(`✅ Logged search: "${query}" (${resultsCount} results)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('❌ Failed to log search:', msg);
    }
  }

  async search(query: string): Promise<unknown> {
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(query),
      this.keywordSearch(query),
    ]);
    const mergedResults = this.mergeResults(vectorResults, keywordResults);
    // Await the logSearch to ensure it completes before sending the response
    await this.logSearch(query, mergedResults.length);
    return { results: mergedResults, total: mergedResults.length, query };
  }

  async getSearchAnalytics(): Promise<unknown> {
    const db = this.firebaseService.getDb();
    const snapshot = await db
      .collection('searchLogs')
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    const logs = snapshot.docs.map((doc) => doc.data() as SearchLog);

    const queryCounts: Record<string, number> = {};
    const zeroResultQueries: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    for (const log of logs) {
      const q = log.query;
      const d = log.date;
      queryCounts[q] = (queryCounts[q] ?? 0) + 1;
      if (log.resultsCount === 0) {
        zeroResultQueries[q] = (zeroResultQueries[q] ?? 0) + 1;
      }
      dailyCounts[d] = (dailyCounts[d] ?? 0) + 1;
    }

    const topSearches = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([q, count]) => ({ query: q, count }));

    const zeroResults = Object.entries(zeroResultQueries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([q, count]) => ({ query: q, count }));

    const last7Days = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, count]) => ({ date, count }));

    return { totalSearches: logs.length, topSearches, zeroResults, last7Days };
  }

  async upsertProductToIndex(
    productId: string,
    product: Product,
  ): Promise<void> {
    if (!this.pineconeAvailable || !this.index) return;

    const textToEmbed = [
      product.name ?? '',
      product.description ?? '',
      product.category ?? '',
      product.manufacturer ?? '',
      product.availability ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const vector = await this.getEmbedding(textToEmbed);
    await this.index.upsert({
      records: [
        {
          id: productId,
          values: vector,
          metadata: {
            productName: product.name ?? '',
            category: product.category ?? '',
          },
        },
      ],
    });
  }

  async removeProductFromIndex(productId: string): Promise<void> {
    if (!this.pineconeAvailable || !this.index) return;
    await this.index.deleteOne({ id: productId });
  }
}
