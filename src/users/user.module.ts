import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma.service';
import { ValidationService } from '../validation/validation.service';

@Module({
  providers: [UserService, PrismaService, ValidationService],
  controllers: [UserController],
})
export class UserModule {}
