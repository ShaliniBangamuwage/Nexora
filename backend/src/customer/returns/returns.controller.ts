import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('returns')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Roles('admin')
  @Get()
  async getReturns() {
    return this.returnsService.getReturns();
  }

  @Roles('customer')
  @Post()
  async submitReturn(@Body() body: any, @Request() req: any) {
    return this.returnsService.submitReturn(body, req.user.uid);
  }
}
