import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Flight, Seats } from './interfaces/flight.interface';
import { ValidationService } from '../validation/validation.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { log } from 'console';

class FlightClass {
  static codeGenerator(originCode: string, destinationCode: string) {
    const number = Math.floor(Math.random() * 1000);
    return 'SW' + number + originCode + destinationCode;
  }
  static getLocationsFile(type: string) {
    type = type.toLowerCase(); // Convierte el tipo a minúsculas
    if (type[0] === 'i')
      type = 'international'; // Si la primera letra es 'i', cambia a 'international'
    else type = 'national'; // De lo contrario, cambia a 'national'
    const filePath = path.join(__dirname, 'locations', `${type}.json`);
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData); // Convierte el contenido a un objeto
  }
  static getLocations(
    type: string,
    originCode: string,
    destinationCode: string,
  ) {
    type = type.toLowerCase();
    if (type[0] === 'i')
      type = 'international'; // Si la primera letra es 'i', cambia a 'international'
    else type = 'national'; // De lo contrario, cambia a 'national'
    const locations = this.getLocationsFile(type);
    let origin = null;
    let destination = null;
    if (type === 'national') {
      origin = locations.capitals.find(
        (location: any) => location.code === originCode,
      );
      destination = locations.capitals.find(
        (location: any) => location.code === destinationCode,
      );
    } else if (type === 'international') {
      origin = locations.origin.find(
        (location: any) => location.code === originCode,
      );
      destination = locations.destination.find(
        (location: any) => location.code === destinationCode,
      );
    }
    if (origin && destination) {
      return {
        origin: origin.city,
        destination: destination.city,
      };
    } else {
      throw new Error('Código de origen o destino no encontrado.');
    }
  }
}
@Injectable()
export class FlightsService {
  constructor(
    private prisma: PrismaService,
    private validation: ValidationService,
  ) {}

  async findAllFlights() {
    return this.prisma.flight.findMany();
  }

  async createFlight(flight: Flight): Promise<any> {
    await this.validation.validateFlightData(flight);
    const {
      code,
      creator,
      type,
      origin,
      destination,
      priceFirstClass,
      priceEconomyClass,
      departureDate1,
      arrivalDate1,
      departureDate2,
      arrivalDate2,
      creationDate,
      lastUpdateDate,
    } = flight;
    let flightCode: string;
    let flightBand = true;
    while (flightBand) {
      flightCode = FlightClass.codeGenerator(origin, destination);
      const existingFlight = await this.prisma.flight.findUnique({
        where: { code: flightCode },
      });
      if (!existingFlight) flightBand = false;
    }
    const typeFlight = type.toLowerCase();
    let locationsFlight: any;
    try {
      locationsFlight = FlightClass.getLocations(
        typeFlight,
        origin,
        destination,
      );
    } catch (error) {
      console.log('Error: ', error.message);
      throw new HttpException(error.message, 400);
    }
    const newFlight = await this.prisma.flight.create({
      data: {
        code: flightCode,
        creator,
        type: typeFlight,
        origin: locationsFlight.origin,
        destination: locationsFlight.destination,
        priceFirstClass,
        priceEconomyClass,
        departureDate1,
        arrivalDate1: arrivalDate1 || null,
        departureDate2,
        arrivalDate2: arrivalDate2 || null,
        creationDate,
        lastUpdateDate,
      },
    });

    if (newFlight) {
      const totalSeats = typeFlight[0] === 'n' ? 150 : 250;
      const totalFirst = typeFlight[0] === 'n' ? 25 : 50;
      const totalTourist = totalSeats - totalFirst;
      const avaliableFirst = [...Array(totalFirst).keys()]
        .map((i) => i + 1)
        .toString();
      const avaliableTourist = [...Array(totalTourist).keys()]
        .map((i) => i + (totalFirst + 1))
        .toString();
      try {
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
      } catch (error) {
        console.log('Error al crear los asientos: ', error.message);
        throw new HttpException(
          'No se pudo crear el vuelo, intente de nuevo.',
          500,
        );
      }
      return newFlight;
    } else {
      throw new HttpException(
        'No se pudo crear el vuelo, intente de nuevo.',
        500,
      );
    }
  }
}
