import { Controller, Get, Post, Put, Body, Param, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { ContactService } from './contact.service';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Customer: submit a message
  @Post()
  async sendMessage(@Body() body: any) {
    return this.contactService.sendMessage(body);
  }

  // Customer: get messages by email
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('customer')
  @Get('by-email')
  async getMessagesByEmail(@Query('email') email: string, @Request() req: any) {
    if (email !== req.user.email) throw new ForbiddenException('You can only view messages for your account');
    return this.contactService.getMessagesByEmail(req.user.email);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllMessages() {
    return this.contactService.getAllMessages();
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(id);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/reply')
  async replyMessage(@Param('id') id: string, @Body() body: { reply: string }) {
    return this.contactService.replyMessage(id, body.reply);
  }
}
