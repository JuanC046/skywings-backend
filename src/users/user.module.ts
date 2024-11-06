import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController, UsersDataController } from './user.controller';
import { PrismaService } from '../prisma.service';
import { ValidationService } from '../validation/validation.service';
import { EmailService } from 'src/email/email.service';

@Module({
  providers: [UserService, PrismaService, ValidationService, EmailService],
  controllers: [UserController, UsersDataController],
})
export class UserModule {}
