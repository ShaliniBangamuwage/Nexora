import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('session')
  @HttpCode(200)
  resolveSession(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { fullName?: string; phone?: string },
  ) {
    return this.authService.resolveSession(authorization, body ?? {});
  }
}