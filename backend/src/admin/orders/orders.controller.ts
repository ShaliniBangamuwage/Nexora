import { Controller, Get, Param, Post, Body, Patch, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('orders')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getAll() {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { orderStatus: string }) {
    return this.ordersService.updateOrderStatus(id, body.orderStatus);
  }

  @Post()
  async create(@Body() orderData: any) {
    return await this.ordersService.createOrder(orderData);
  }
}
