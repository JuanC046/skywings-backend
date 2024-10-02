import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ValidationService } from '../users/validation/validation.service';
@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
  ],
  providers: [AuthService, PrismaService, JwtService, ValidationService],
  controllers: [AuthController],
})
export class AuthModule {}
