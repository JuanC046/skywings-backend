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
  async getSeatNumber(flightCode: string, seatClass: string) {
    const seats = await this.findSeatsByFlight(flightCode);
    if (!seats) {
      throw new HttpException('Vuelo no encontrado', 404);
    }
    const availableSeats =
      seatClass === 'Tourist'
        ? Array(seats.avaliableTourist)
        : Array(seats.avaliableFirst);
    // Select a random item from the array
    const seatNumber =
      availableSeats[Math.floor(Math.random() * availableSeats.length)];
    console.log('Available seats: ', availableSeats);
    console.log('Seat number: ', seatNumber);
    return seatNumber;
  }
}
