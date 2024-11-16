import { Controller, Body, Post, Get, Param } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketsData } from './interfaces/ticket.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('create')
  async createTickets(@Body() ticketsData: TicketsData): Promise<any> {
    return this.ticketService.createTickets(ticketsData);
  }

  @Get('/ticket/:flightCode/:passengerDni')
  async findTicket(
    @Param('flightCode') flightCode: string,
    @Param('passengerDni') passengerDni: string,
  ): Promise<any> {
    return this.ticketService.findTicket(flightCode, passengerDni);
  }
  @Get('/reservations/:username')
  async findReservations(@Param('username') username: string): Promise<any> {
    return this.ticketService.findReservations(username);
  }
}
