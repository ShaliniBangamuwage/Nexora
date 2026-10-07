import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { LoyaltyService, LoyaltyCustomer } from './loyalty.service';
import { AIService } from './ai.service';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('loyalty')
export class LoyaltyController {
  constructor(
    private readonly loyaltyService: LoyaltyService,
    private readonly aiService: AIService,
  ) {}

  @Get('analytics')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async getAnalytics() {
    try {
      return await this.loyaltyService.getAnalytics();
    } catch (error) {
      const err = error as Error & { stack?: string };
      console.error('analytics error:', err?.message, err?.stack);
      return {
        totalCustomers: 0,
        totalRevenue: 0,
        totalPoints: 0,
        averageOrderValue: 0,
        levelDistribution: { Silver: 0, Gold: 0, Platinum: 0 },
      };
    }
  }

  @Get('top-customers')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async getTopCustomers() {
    try {
      return await this.loyaltyService.getTopCustomers();
    } catch (error) {
      const err = error as Error & { stack?: string };
      console.error('top-customers error:', err?.message, err?.stack);
      return [];
    }
  }

  @Get('campaign-ideas')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async getCampaignIdeas() {
    try {
      const ideas = await this.aiService.generateCampaignIdeas();
      return { ideas };
    } catch (error) {
      const err = error as Error & { stack?: string };
      console.error('campaign-ideas error:', err?.message, err?.stack);
      return { ideas: [] };
    }
  }

  @Get('customer/:uid/offers')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer', 'admin')
  async getPersonalizedOffers(@Param('uid') uid: string, @Req() req: any) {
    if (req.user.role === 'customer' && req.user.uid !== uid) throw new ForbiddenException('You cannot access another customer account');
    try {
      const offers = await this.loyaltyService.generatePersonalizedOffers(uid);
      return { offers };
    } catch (error) {
      const err = error as Error;
      console.error('offers error:', err?.message);
      return { offers: [] };
    }
  }

  @Get('customer/:uid')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer', 'admin')
  async getCustomerProfile(@Param('uid') uid: string, @Req() req: any) {
    if (req.user.role === 'customer' && req.user.uid !== uid) throw new ForbiddenException('You cannot access another customer account');
    try {
      // If uid looks like email, lookup by email and auto-sync to loyaltyCustomers
      if (uid.includes('@')) {
        return await this.loyaltyService.getCustomerByEmailAndSync(uid);
      }
      return await this.loyaltyService.getCustomerProfile(uid);
    } catch (error) {
      const err = error as Error;
      console.error('customer profile error:', err?.message);
      return null;
    }
  }

  @Put('customer/:uid')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async updateCustomerProfile(
    @Param('uid') uid: string,
    @Body() updates: Partial<LoyaltyCustomer>,
  ) {
    try {
      await this.loyaltyService.updateCustomerProfile(uid, updates);
      return { success: true };
    } catch (error) {
      const err = error as Error;
      console.error('update profile error:', err?.message);
      return { success: false, error: err?.message };
    }
  }

  @Post('purchase')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async addPurchase(
    @Body() body: { uid: string; orderAmount: number; orderId: string },
  ) {
    try {
      await this.loyaltyService.addPurchase(
        body.uid,
        body.orderAmount,
        body.orderId,
      );
      return { success: true };
    } catch (error) {
      const err = error as Error;
      console.error('add purchase error:', err?.message);
      return { success: false, error: err?.message };
    }
  }

  @Post('sync-from-orders')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async syncFromOrders() {
    try {
      return await this.loyaltyService.syncFromOrders();
    } catch (error) {
      const err = error as Error;
      console.error('sync error:', err?.message);
      return { success: false, error: err?.message };
    }
  }

  @Post('consolidate-duplicates')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async consolidateDuplicates() {
    try {
      return await this.loyaltyService.consolidateDuplicates();
    } catch (error) {
      const err = error as Error;
      console.error('consolidate error:', err?.message);
      return { success: false, error: err?.message };
    }
  }

  @Get('debug-orders/:email')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async debugOrders(@Param('email') email: string) {
    const db = this.loyaltyService['firebaseService'].getDb();
    const snap = await db
      .collection('CustomerOrders')
      .where('email', '==', email)
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
      email: doc.data().email,
      customerName: doc.data().customerName,
      totalAmount: doc.data().totalAmount,
      createdAt: doc.data().createdAt,
    }));
  }

  @Get('debug-loyalty/:uid')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async debugLoyalty(@Param('uid') uid: string) {
    const db = this.loyaltyService['firebaseService'].getDb();
    const doc = await db.collection('loyaltyCustomers').doc(uid).get();
    return { id: doc.id, exists: doc.exists, data: doc.data() };
  }
}
