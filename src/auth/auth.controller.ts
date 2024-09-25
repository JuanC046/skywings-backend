import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Credentials } from '../users/interfaces/credentials.interface';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/auth.roles.guard';
import { Roles } from './decorator/roles.decorator';
import { Role } from './decorator/roles.enum';
import { Request } from 'express';

interface ReqWithUser extends Request {
  user: {
    username: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: Credentials): Promise<any> {
    return this.authService.login(credentials);
  }

  // Ejemplo de ruta protegida por rol
  @Get('/rootPanel')
  @Roles(Role.Root)
  @UseGuards(AuthGuard, RolesGuard)
  getHome(@Req() req: ReqWithUser): string {
    console.log(req.user);
    return 'Welcome back Root User';
  }
}
