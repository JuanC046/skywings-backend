import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import {
  PurchaseController,
  CancelTicketController,
  CancelFlightController,
} from './purchase.controller';
import { PrismaService } from '../prisma.service';
import { TicketService } from '../ticket/ticket.service';
import { FinancialService } from '../financial/financial.service';
import { TicketModule } from 'src/ticket/ticket.module';
import { FinancialModule } from 'src/financial/financial.module';
import { FlightsModule } from 'src/flights/flights.module';
import { FlightsService } from 'src/flights/flights.service';
import { UserModule } from 'src/users/user.module';
import { UserService } from 'src/users/user.service';
import { EmailService } from 'src/email/email.service';

@Module({
  providers: [
    PurchaseService,
    PrismaService,
    TicketService,
    FinancialService,
    FlightsService,
    UserService,
    EmailService,
  ],
  controllers: [
    PurchaseController,
    CancelTicketController,
    CancelFlightController,
  ],
  imports: [TicketModule, FinancialModule, FlightsModule, UserModule],
})
export class PurchaseModule {}
