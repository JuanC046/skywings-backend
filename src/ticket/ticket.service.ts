import { Passenger, PassengersData } from './interfaces/passenger.interface';
import { Ticket, TicketsData } from './interfaces/ticket.interface';
import { PrismaService } from '../prisma.service';
import { HttpException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { SeatsService } from 'src/flights/seats.service';
import { FlightsService } from 'src/flights/flights.service';
import { PassengerService } from './passenger.service';
@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private flightsService: FlightsService,
    private seatsService: SeatsService,
    private passengerService: PassengerService,
  ) {}

  private async createTicketInDataBase(ticket: Ticket) {
    try {
      const createdTicket = await this.prisma.ticket.create({
        data: ticket,
      });
      return createdTicket;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al crear el ticket.', 500);
    }
  }
  private async createTicket(
    flightCode: string,
    username: string,
    passenger: Passenger,
    seatClass: string,
    purchaseId: number,
  ): Promise<Ticket> {
    const seatNumber = await this.seatsService.assignSeat(
      flightCode,
      seatClass,
    );
    const flight = await this.flightsService.findFlightByCode(flightCode);
    const price =
      seatClass === 'First' ? flight.priceFirstClass : flight.priceEconomyClass;
    const ticket: Ticket = {
      flightCode,
      passengerDni: passenger.dni,
      username,
      seatNumber,
      purchaseId,
      price,
      creationDate: new Date(),
      numSuitcase: 0,
    };
    await this.createTicketInDataBase(ticket);
    return ticket;
  }

  // Encontar si el vuelo se repite en la lista passengersData
  private findRepeatedFlight(passengersData: PassengersData[]) {
    const flights: string[] = [];
    const repeatedFlights: string[] = [];
    for (const flightPassengers of passengersData) {
      if (flights.includes(flightPassengers.flightCode)) {
        repeatedFlights.push(flightPassengers.flightCode);
      }
      flights.push(flightPassengers.flightCode);
    }
    return repeatedFlights;
  }
  // Unir los pasajeros de un mismo vuelo en una sola lista de pasajeros
  private mergePassengers(
    passengersData: PassengersData[],
    flightCode: string,
  ): Passenger[] {
    const passengers: Passenger[] = [];
    for (const flightPassengers of passengersData) {
      if (flightPassengers.flightCode === flightCode) {
        passengers.push(...flightPassengers.passengers);
      }
    }
    return passengers;
  }
  private async flightTicketsOfUser(username: string, flightCode: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        flightCode,
        username,
      },
    });
    return tickets;
  }
  // Validar que un usuario no tenga más de 5 tickets en un vuelo
  private async validateUserMaxTickets(
    username: string,
    flightCode: string,
    numNewTickets: number,
  ) {
    const userTickets = await this.flightTicketsOfUser(username, flightCode);
    if (userTickets.length + numNewTickets > 5) {
      console.error(
        `Error: No se pueden comprar más de 5 tickets por usuario en un mismo vuelo. Vuelo: ${flightCode}.`,
      );
      throw new HttpException(
        `No se pueden comprar más de 5 tickets por usuario en un mismo vuelo. Vuelo: ${flightCode}.`,
        400,
      );
    }
  }
  // Obtener la lista de dni de los pasajeros de un vuelo con un usuario de la base de datos
  private async getPassengersDni(flightCode: string, username: string) {
    const passengersDni = await this.prisma.ticket.findMany({
      where: {
        flightCode,
        username,
      },
      select: { passengerDni: true },
    });
    return passengersDni.map((passenger) => passenger.passengerDni);
  }


  private validatePassengersAges(passengers: Passenger[], flightCode: string) {
    const validPassengers =
      this.passengerService.validatePassengersAges(passengers);
    if (!validPassengers) {
      throw new HttpException(
        `Los menores de edad no pueden viajar solos. Vuelo: ${flightCode}.`,
        400,
      );
    }
  }
  private async validateTickets(
    listTickets: PassengersData[],
    username: string,
    flightCode: string,
  ) {
    let listPassengers: Passenger[] = this.mergePassengers(
      listTickets,
      flightCode,
    );
    await this.validateUserMaxTickets(
      username,
      flightCode,
      listPassengers.length,
    );
    const passengersDni = await this.getPassengersDni(flightCode, username);
    const passengers: Passenger[] =
      await this.passengerService.getPassengersByFlightCode(
        passengersDni,
        flightCode,
      );
    listPassengers = listPassengers.concat(passengers);
    this.validatePassengersAges(listPassengers, flightCode);
  }
  private async createPassengerTickets(
    passengersData: PassengersData,
    purchaseId: number,
    username: string,
  ) {
    const { flightCode, seatClass, passengers } = passengersData;
    await this.validateTickets([passengersData], username, flightCode);
    try {
      const tickets: Ticket[] = [];
      for (const passenger of passengers) {
        passenger.flightCode = flightCode;
        const passengerCreated =
          await this.passengerService.createPassegerInDataBase(passenger);
        const ticket = await this.createTicket(
          flightCode,
          username,
          passengerCreated,
          seatClass,
          purchaseId,
        );
        tickets.push(ticket);
      }
      return tickets;
    } catch (error) {
      console.error(error);
      if (error.status === 400) {
        throw error;
      }
      throw new HttpException('Error al crear los tickets.', 500);
    }
  }
  async createTickets(ticketsData: TicketsData) {
    const { username, purchaseId, listTickets } = ticketsData;
    const repeatedFlights = this.findRepeatedFlight(listTickets);
    if (repeatedFlights.length > 0) {
      for (const flightCode of repeatedFlights) {
        await this.validateTickets(listTickets, username, flightCode);
      }
    }
    const tickets: Ticket[] = [];
    for (const passengersData of listTickets) {
      const passengerTickets = await this.createPassengerTickets(
        passengersData,
        purchaseId,
        username,
      );
      tickets.push(...passengerTickets);
    }
    return tickets;
  }

  async findTicket(flightCode: string, passengerDni: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        flightCode,
        passengerDni,
      },
    });
    if (!ticket) {
      throw new HttpException('Ticket no encontrado.', 404);
    }
    return ticket;
  }
}
