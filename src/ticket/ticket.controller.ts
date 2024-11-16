import { Controller, Body, Post } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketsData } from './interfaces/ticket.interface';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('create')
  async createTickets(@Body() ticketsData: TicketsData): Promise<any> {
    return this.ticketService.createTickets(ticketsData);
  }
}
