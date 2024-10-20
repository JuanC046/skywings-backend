import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Flight, Seats } from './interfaces/flight.interface';
import { New } from './interfaces/new.interface';
import { ValidationService } from '../validation/validation.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';

class FlightClass {
  constructor(private prisma: PrismaService) {}

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
  static formatDate(date: Date) {
    // Parsear la fecha sin cambiar el valor
    const newDate = new Date(date);

    // Formatear la fecha con las opciones de formato usado en Colombia
    const formatOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // Para formato de 12 horas (am/pm)
      timeZone: 'UTC', // Mantiene la hora sin convertirla a la zona local
    };

    // Mostrar la fecha formateada en el formato colombiano
    const formatedDate = new Intl.DateTimeFormat('es-CO', formatOptions).format(
      newDate,
    );
    // console.log(formatedDate); // Ejemplo de salida: "20/10/2024, 03:30:00 p. m."
    return formatedDate;
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

  async findAllNews() {
    return this.prisma.news.findMany();
  }
  async createNew(newData: New): Promise<any> {
    const { title, content, creationDate } = newData;
    try {
      const flightNew = await this.prisma.news.create({
        data: {
          title,
          content,
          creationDate,
        },
      });
      return flightNew;
    } catch (error) {
      console.log('Error al crear la noticia: ', error.message);
      throw new Error(error.message);
    }
  }
  async createFlight(flight: Flight): Promise<any> {
    await this.validation.validateFlightData(flight);
    const {
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
        // Convertir la fecha de salida al formato usado en colombia para la fecha y hora, sin cambiar la zona horaria de la fecha departureDate1
        const departureDate1Colombia = FlightClass.formatDate(departureDate1);
        const flightNew = await this.createNew({
          title: `¡Nuevo vuelo ${typeFlight[0] === 'i' ? 'Internacional' : 'Nacional'}!`,
          content: `De ${locationsFlight.origin} a ${locationsFlight.destination}\n${departureDate1Colombia}\nPrecios desde ${priceEconomyClass} COP por trayecto`,
          creationDate,
        });
      } catch (error) {
        console.log('Error: ', error.message);
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
