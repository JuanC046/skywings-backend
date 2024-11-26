import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from 'src/email/email.service';
@Module({
  controllers: [CheckinController],
  providers: [CheckinService, PrismaService, EmailService],
})
export class CheckinModule {}
