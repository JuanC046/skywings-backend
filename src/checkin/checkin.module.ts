import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from 'src/email/email.service';
import { BoardingPassService } from 'src/boarding-pass/boarding-pass.service';
import { SeatsService } from 'src/flights/seats.service';
@Module({
  controllers: [CheckinController],
  providers: [
    CheckinService,
    PrismaService,
    EmailService,
    BoardingPassService,
    SeatsService,
  ],
})
export class CheckinModule {}
