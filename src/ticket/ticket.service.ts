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
  private async isFlightValid(flightCode: string) {
    const vigentsFlights = await this.flightsService.findActualFlights();
    const vigentFlight = vigentsFlights.find(
      (flight) => flight.code === flightCode,
    );
    if (!vigentFlight) {
      throw new HttpException('El vuelo no se encuentra vigente.', 400);
    }
  }
  private async validateTickets(
    listTickets: PassengersData[],
    username: string,
    flightCode: string,
  ) {
    await this.isFlightValid(flightCode);
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
    const { username, listTickets } = ticketsData;
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
  private async findReservedTicketsByUser(username: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        username,
        purchaseId: 0,
      },
    });
    return tickets;
  }
  private async deleteTicket(ticket: Ticket) {
    try {
      await this.prisma.ticket.delete({
        where: {
          flightCode_passengerDni: {
            flightCode: ticket.flightCode,
            passengerDni: ticket.passengerDni,
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al borrar el ticket.', 500);
    }
  }
  private async isReservedTicketValid(ticket: Ticket) {
    const currentDate = new Date();
    const flight = await this.flightsService.findFlightByCode(
      ticket.flightCode,
    );
    const departureDate = new Date(flight.departureDate1);
    const difference = departureDate.getTime() - currentDate.getTime();
    const hoursDifference = difference / (1000 * 3600);
    const creationDate = new Date(ticket.creationDate);
    const expiredReservation = currentDate.getTime() - creationDate.getTime();
    const hoursExpired = expiredReservation / (1000 * 3600);
    if (flight.erased || hoursDifference < 1 || hoursExpired > 24) {
      return false;
    }
    return true;
  }
  async findReservations(username: string) {
    const tickets = await this.findReservedTicketsByUser(username);
    const validTickets: Ticket[] = [];
    for (const ticket of tickets) {
      const isValid = await this.isReservedTicketValid(ticket);
      if (!isValid) {
        await this.deleteTicket(ticket);
      }
      validTickets.push(ticket);
    }
    return validTickets;
  }
  async setTicketPurchaseId(
    flightCode: string,
    passengerDni: string,
    purchaseId: number,
  ) {
    try {
      await this.prisma.ticket.update({
        where: {
          flightCode_passengerDni: {
            flightCode,
            passengerDni,
          },
        },
        data: {
          purchaseId,
        },
      });
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al asignar el id de la compra.', 500);
    }
  }
}