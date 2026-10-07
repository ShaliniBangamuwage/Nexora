import { Controller, Get, Put, Param, Body, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('profile')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('customer')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':uid')
  async getProfile(@Param('uid') uid: string, @Request() req: any) {
    if (uid !== req.user.uid) throw new ForbiddenException('You cannot access another customer profile');
    return this.profileService.getProfile(uid);
  }

  @Put(':uid')
  async updateProfile(@Param('uid') uid: string, @Body() body: any, @Request() req: any) {
    if (uid !== req.user.uid) throw new ForbiddenException('You cannot update another customer profile');
    return this.profileService.updateProfile(uid, body);
  }
}
