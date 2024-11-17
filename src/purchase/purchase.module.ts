import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { PrismaService } from '../prisma.service';
import { TicketService } from '../ticket/ticket.service';
import { FinancialService } from '../financial/financial.service';
import { TicketModule } from 'src/ticket/ticket.module';
import { FinancialModule } from 'src/financial/financial.module';
import { FlightsModule } from 'src/flights/flights.module';
import { FlightsService } from 'src/flights/flights.service';

@Module({
  providers: [
    PurchaseService,
    PrismaService,
    TicketService,
    FinancialService,
    FlightsService,
  ],
  controllers: [PurchaseController],
  imports: [TicketModule, FinancialModule, FlightsModule],
})
export class PurchaseModule {}
