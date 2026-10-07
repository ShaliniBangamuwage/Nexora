import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI | null;

  constructor() {
    // Initialize OpenAI only if API key is provided
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      this.openai = null;
      console.warn(
        '⚠️  OpenAI API key not configured. AI features will use fallback responses.',
      );
    }
  }

  async generatePersonalizedOffers(customerData: any): Promise<string[]> {
    if (!this.openai) {
      // Return fallback offers when OpenAI is not available
      return [
        '10% discount on next purchase',
        'Free delivery on orders over $50',
        'Bonus loyalty points on vitamins',
        'Birthday special - 15% off your favorite items',
        'Refer a friend and earn bonus points',
      ];
    }

    const prompt = `
    Based on this customer data, suggest 3-5 personalized loyalty offers or promotions:
    - Name: ${customerData.name}
    - Level: ${customerData.level}
    - Total Spent: $${customerData.totalSpent}
    - Purchase Count: ${customerData.purchaseCount}
    - Average Order Value: $${customerData.averageOrderValue}
    - Last Purchase: ${customerData.lastPurchase}
    - Churn Risk: ${customerData.predictedChurnRisk}%

    Focus on pharmacy products and encourage repeat purchases.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      });

      const suggestions =
        response.choices[0]?.message?.content
          ?.split('\n')
          .filter((line) => line.trim()) || [];
      return suggestions.slice(0, 5);
    } catch (error) {
      console.error('AI service error:', error);
      return [
        '10% discount on next purchase',
        'Free delivery on orders over $50',
        'Bonus loyalty points on vitamins',
      ];
    }
  }

  async predictChurnRisk(customerData: any): Promise<number> {
    // Simple heuristic for now, can be enhanced with ML model
    const daysSinceLastPurchase =
      (Date.now() - new Date(customerData.lastPurchase).getTime()) /
      (1000 * 60 * 60 * 24);
    const risk = Math.min(
      100,
      Math.max(
        0,
        (daysSinceLastPurchase - 30) * 2 + (100 - customerData.purchaseCount),
      ),
    );
    return Math.round(risk);
  }

  async generateCampaignIdeas(): Promise<string[]> {
    if (!this.openai) {
      // Return fallback campaign ideas
      return [
        'Monthly refill reminder program with points bonus',
        'Family health package discounts',
        'Senior citizen wellness rewards',
        'Seasonal vitamin promotion campaigns',
        'Loyalty points for health check referrals',
      ];
    }

    const prompt = `
    Generate 5 creative loyalty campaign ideas for a pharmacy, focusing on:
    - Encouraging repeat purchases
    - Medicine refill reminders
    - Seasonal promotions
    - Family health packages
    - Senior citizen discounts
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      });

      return (
        response.choices[0]?.message?.content
          ?.split('\n')
          .filter((line) => line.trim()) || []
      );
    } catch (error) {
      console.error('AI service error:', error);
      return [
        'Monthly refill reminder program with points bonus',
        'Family health package discounts',
        'Senior citizen wellness rewards',
        'Seasonal vitamin promotion campaigns',
        'Loyalty points for health check referrals',
      ];
    }
  }
}
