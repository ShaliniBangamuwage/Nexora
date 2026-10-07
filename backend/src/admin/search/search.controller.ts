import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from '../../shared/search/search.service.js';
import { SyncService } from '../../shared/search/sync.service.js';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('admin/search')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly syncService: SyncService,
  ) {}

  @Get()
  search(@Query('q') query: string): Promise<unknown> {
    if (!query || query.trim() === '') {
      return Promise.resolve({ results: [], total: 0 });
    }
    return this.searchService.search(query.trim());
  }

  @Get('sync')
  syncProducts(): Promise<unknown> {
    return this.syncService.syncAllProducts();
  }

  @Get('analytics')
  getAnalytics(): Promise<unknown> {
    return this.searchService.getSearchAnalytics();
  }
}
