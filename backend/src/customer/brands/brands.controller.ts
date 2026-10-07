import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  async getBrands() {
    return this.brandsService.getBrands();
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  async addBrand(@Body() body: any) {
    return this.brandsService.addBrand(body);
  }
}
