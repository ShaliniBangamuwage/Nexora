import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { AccountRequestsService } from './account-requests.service.js';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('account-requests')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin')
export class AccountRequestsController {
  constructor(private readonly service: AccountRequestsService) {}

  @Get()
  getAll() {
    return this.service.getRequests();
  }

  @Post(':id/approve')
  @HttpCode(200)
  approve(@Param('id') id: string) {
    return this.service.approveRequest(id);
  }

  @Post(':id/reject')
  @HttpCode(200)
  reject(@Param('id') id: string) {
    return this.service.rejectRequest(id);
  }
}
