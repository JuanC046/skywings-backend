import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/auth.roles.guard';
import { Roles } from './decorator/roles.decorator';
import { Role } from './decorator/roles.enum';
import { Credentials } from '../users/interfaces/credentials.interface';
import { User } from '../users/interfaces/user.interface';

interface ReqWithUser extends Request {
  user: {
    username: string;
    email: string;
    role: string;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: Credentials): Promise<any> {
    return this.authService.login(credentials);
  }

  @Post('signup')
  async signup(@Body() userData: User): Promise<any> {
    console.log(userData);
    return this.authService.register(userData);
  }

  // Ejemplo de ruta protegida por rol
  @Get('rootPanel')
  @Roles(Role.Root)
  @UseGuards(AuthGuard, RolesGuard)
  getHome(@Req() req: ReqWithUser): string {
    console.log(req.user);
    return 'Welcome back Root User';
  }
}
