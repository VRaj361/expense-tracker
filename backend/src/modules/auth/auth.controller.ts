import { Controller, Get, Post, Body, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const tokens = await this.authService.generateTokens(req.user);
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }
    try {
      return await this.authService.refreshTokens(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Get('me')
  async getMe(@Req() req: any) {
    return req.user;
  }
}
