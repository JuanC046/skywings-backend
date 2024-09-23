import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Credentials } from '../users/interfaces/credentials.interface';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: Credentials): Promise<any> {
    return this.authService.login(credentials);
  }

  @UseGuards(AuthGuard)
  @Get('home')
  getHome(@Req() req): string {
    console.log(req.user);
    return 'Hello from AuthController';
  }
}
