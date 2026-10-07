import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminCatalogService } from './admin-catalog.service.js';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('admin/catalog')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Get('products') listProducts() { return this.catalog.listProducts(); }
  @Post('products') createProduct(@Body() body: Record<string, any>) { return this.catalog.createProduct(body); }
  @Patch('products/:id') updateProduct(@Param('id') id: string, @Body() body: Record<string, any>) { return this.catalog.updateProduct(id, body); }
  @Delete('products/:id') archiveProduct(@Param('id') id: string) { return this.catalog.archiveProduct(id); }
  @Put('products/:id/stock') updateStock(@Param('id') id: string, @Body() body: { stock: number }) { return this.catalog.updateStock(id, Number(body.stock)); }

  @Post('images')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!file.mimetype.startsWith('image/')) return callback(new BadRequestException('Only image files are allowed'), false);
      callback(null, true);
    },
  }))
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('An image file is required');
    return this.catalog.uploadProductImage(file);
  }

  @Get('categories') listCategories() { return this.catalog.listTaxonomy('categories'); }
  @Post('categories') createCategory(@Body() body: { name: string }) { return this.catalog.createTaxonomy('categories', body.name); }
  @Patch('categories/:id') updateCategory(@Param('id') id: string, @Body() body: { name: string }) { return this.catalog.updateTaxonomy('categories', id, body.name); }
  @Delete('categories/:id') archiveCategory(@Param('id') id: string) { return this.catalog.archiveTaxonomy('categories', id); }

  @Get('brands') listBrands() { return this.catalog.listTaxonomy('brands'); }
  @Post('brands') createBrand(@Body() body: { name: string }) { return this.catalog.createTaxonomy('brands', body.name); }
  @Patch('brands/:id') updateBrand(@Param('id') id: string, @Body() body: { name: string }) { return this.catalog.updateTaxonomy('brands', id, body.name); }
  @Delete('brands/:id') archiveBrand(@Param('id') id: string) { return this.catalog.archiveTaxonomy('brands', id); }
}
