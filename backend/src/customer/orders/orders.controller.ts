import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('customer-orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer')
  @Post()
  async createOrder(@Request() req: any, @Body() body: any) {
    return this.ordersService.createOrder(body, req.user);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer')
  @Get('generate-hash')
  // Hash inputs are derived from the persisted order; clients cannot set amount.
  async generateHash(
    @Request() req: any,
    @Query('orderId') orderId: string,
    @Query('currency') currency: string,
  ) {
    return this.ordersService.generateHash(orderId, currency || 'LKR', req.user);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer')
  @Get()
  async getOrders(@Request() req: any) {
    return this.ordersService.getOrders(req.user.uid);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer')
  @Get('delivered')
  async getDeliveredOrders(@Request() req: any) {
    return this.ordersService.getDeliveredOrders(req.user.uid);
  }

  // ─── UNCHANGED ─────────────────────────────────────────────────────────────
  @Get('product-code/:name')
  async getProductCode(@Param('name') name: string) {
    return this.ordersService.getProductCodeByName(name);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer', 'admin')
  @Get('details/:id')
  async getOrderDetails(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.getOrderDetails(id, req.user);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer')
  @Post(':id/cancel-payment')
  async cancelPendingPayment(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.cancelPendingPayment(id, req.user.uid);
  }

  @Post('notify')
  async notify(@Body() body: any) {
    return this.ordersService.handleNotify(body);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/settle-payment')
  async settlePayment(@Param('id') id: string) {
    return this.ordersService.settlePayment(id);
  }
}
