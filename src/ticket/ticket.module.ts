import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { PrismaService } from '../prisma.service';
import { FlightsService } from '../flights/flights.service';
import { SeatsService } from '../flights/seats.service';
import { FlightsModule } from 'src/flights/flights.module';
import { PassengerService } from './passenger.service';
import { EmailService } from 'src/email/email.service';
@Module({
  controllers: [TicketController],
  providers: [
    TicketService,
    PrismaService,
    FlightsService,
    SeatsService,
    PassengerService,
    EmailService,
  ],
  imports: [FlightsModule],
  exports: [PassengerService],
})
export class TicketModule {}
