import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('cart')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('customer')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':customerId')
  async getCart(@Param('customerId') customerId: string, @Request() req: any) {
    return this.cartService.getCart(customerId, req.user.uid);
  }

  @Post()
  async addItem(@Body() body: any, @Request() req: any) {
    return this.cartService.addItem({ ...body, customerId: req.user.uid });
  }

  @Patch(':id')
  async updateQty(@Param('id') id: string, @Body() body: { qty: number }, @Request() req: any) {
    return this.cartService.updateQty(id, body.qty, req.user.uid);
  }

  @Delete('clear/:customerId')
  async clearCart(@Param('customerId') customerId: string, @Request() req: any) {
    return this.cartService.clearCart(customerId, req.user.uid);
  }

  @Delete(':id')
  async removeItem(@Param('id') id: string, @Request() req: any) {
    return this.cartService.removeItem(id, req.user.uid);
  }
}
