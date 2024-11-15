import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Seats } from './interfaces/flight.interface';
@Injectable()
export class SeatsService {
  constructor(private prisma: PrismaService) {}
  async createSeatsConfiguration(flightCode: string, typeFlight: string) {
    // Configuración de los asientos del vuelo basado en el tipo (nacional o internacional)
    const totalSeats = typeFlight.startsWith('n') ? 150 : 250;
    const totalFirst = typeFlight.startsWith('n') ? 25 : 50;
    const totalTourist = totalSeats - totalFirst;

    const avaliableFirst = [...Array(totalFirst).keys()]
      .map((i) => i + 1)
      .toString();
    const avaliableTourist = [...Array(totalTourist).keys()]
      .map((i) => i + totalFirst + 1)
      .toString();

    // Creación de la configuración de asientos
    const seats: Seats = {
      flightCode: flightCode,
      totalSeats,
      totalFirst,
      totalTourist,
      avaliableFirst,
      avaliableTourist,
      busyFirst: [].toString(),
      busyTourist: [].toString(),
      erased: false,
    };

    await this.prisma.seats.create({
      data: seats,
    });
  }
  async findSeatsByFlight(flightCode: string) {
    const seats = await this.prisma.seats.findUnique({
      where: { flightCode, erased: false },
    });
    if (!seats) {
      throw new HttpException('No se encontraron asientos.', 404);
    }
    return seats;
  }
  private listSeatsByType(
    seatClass: string,
    state: number,
    seats: Seats,
  ): number[] {
    // Seat State 0: Available, 1: Busy
    let seatsByType: string;
    if (state === 0) {
      seatsByType =
        seatClass === 'Tourist' ? seats.avaliableTourist : seats.avaliableFirst;
    } else {
      seatsByType =
        seatClass === 'Tourist' ? seats.busyTourist : seats.busyFirst;
    }
    return seatsByType.split(',').map((i) => parseInt(i));
  }

  private bookingSeat(
    seatNumber: number,
    seatClass: string,
    seats: Seats,
  ): { availableSeats: number[]; busySeats: number[] } {
    const availableSeats = this.listSeatsByType(seatClass, 0, seats);
    availableSeats.splice(availableSeats.indexOf(seatNumber), 1);
    const busySeats = this.listSeatsByType(seatClass, 1, seats);
    busySeats.push(seatNumber);
    return { availableSeats, busySeats };
  }
  private cancelSeat(
    seatNumber: number,
    seatClass: string,
    seats: Seats,
  ): { availableSeats: number[]; busySeats: number[] } {
    const busySeats = this.listSeatsByType(seatClass, 1, seats);
    busySeats.splice(busySeats.indexOf(seatNumber), 1);
    const availableSeats = this.listSeatsByType(seatClass, 0, seats);
    availableSeats.push(seatNumber);
    return { availableSeats, busySeats };
  }
  private async updateSeats(seats: Seats) {
    await this.prisma.seats.update({
      where: { flightCode: seats.flightCode },
      data: seats,
    });
  }
  async assignSeat(flightCode: string, seatClass: string) {
    const seats = await this.findSeatsByFlight(flightCode);
    const availableSeats = this.listSeatsByType(seatClass, 0, seats);
    if (availableSeats.length === 0) {
      throw new HttpException('No hay asientos disponibles.', 404);
    }
    const seatNumber =
      availableSeats[Math.floor(Math.random() * availableSeats.length)];
    const { availableSeats: newAvailableSeats, busySeats: newBusySeats } =
      this.bookingSeat(seatNumber, seatClass, seats);
    if (seatClass === 'Tourist') {
      seats.avaliableTourist = newAvailableSeats.toString();
      seats.busyTourist = newBusySeats.toString();
    } else {
      seats.avaliableFirst = newAvailableSeats.toString();
      seats.busyFirst = newBusySeats.toString();
    }
    await this.updateSeats(seats);
    return seatNumber;
  }
}
