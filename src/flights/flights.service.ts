import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Flight, Seats } from './interfaces/flight.interface';
import { New } from './interfaces/new.interface';
import { ValidationService } from '../validation/validation.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { SrvRecord } from 'dns';

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
    else if (type[0] === 'n')
      type = 'national'; // De lo contrario, cambia a 'national'
    else type = 'times'; // De lo contrario, cambia a 'times'
    const filePath = path.join(__dirname, 'locations', `${type}.json`);
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData); // Convierte el contenido a un objeto
  }
  static getLocations(
    type: string,
    originCode: string,
    destinationCode: string,
  ) {
    // Normaliza el tipo de vuelo
    const normalizedType = type.toLowerCase().startsWith('i')
      ? 'international'
      : 'national';

    // Obtiene las ubicaciones según el tipo
    const locations = this.getLocationsFile(normalizedType);

    // Función auxiliar para buscar una ubicación por código
    const findLocation = (locationsList: any[], code: string) => {
      return locationsList.find((location: any) => location.code === code);
    };

    let origin = null;
    let destination = null;

    // Busca el origen (en el caso de vuelos internacionales puede estar tanto en 'colombia' como en 'international')
    if (normalizedType === 'national') {
      origin = findLocation(locations.capitals, originCode);
      destination = findLocation(locations.capitals, destinationCode);
    } else if (normalizedType === 'international') {
      // Primero encuentra el origen
      origin =
        findLocation(locations.colombia, originCode) ||
        findLocation(locations.international, originCode);

      // Si el origen es internacional, el destino debe ser una ciudad colombiana
      if (findLocation(locations.international, originCode)) {
        destination = findLocation(locations.colombia, destinationCode);
      }
      // Si el origen es colombiano, el destino debe ser una ciudad internacional
      else if (findLocation(locations.colombia, originCode)) {
        destination = findLocation(locations.international, destinationCode);
      }
    }

    // Verifica si se encontraron las ubicaciones
    if (origin && destination) {
      console.log('Origin: ', origin);
      console.log('Destination: ', destination);
      return {
        origin: origin.city,
        destination: destination.city,
      };
    } else {
      console.log('Error: Código de origen o destino no encontrado.');
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

  static flightTime(type: string, origin: string, destination: string) {
    // Obtiene el archivo de tiempos de vuelo
    const times = this.getLocationsFile('times');
    type = type.toLowerCase();

    // Función auxiliar para encontrar un vuelo basado en el origen o destino
    const findFlight = (
      flightList: any[],
      originCode: string,
      destinationCode: string,
    ) => {
      return flightList.find(
        (flight: any) =>
          flight.code === originCode || flight.code === destinationCode,
      );
    };

    try {
      // Si es vuelo internacional
      if (type.startsWith('i')) {
        const flightObj = findFlight(times.flights, origin, destination);
        if (!flightObj) throw new Error('No se encontró el vuelo.');
        return flightObj.flight_time; // Retorna el tiempo de vuelo internacional
      }
      // Si es vuelo nacional
      else {
        const flightObj = times.flights.find((flight: any) =>
          flight.type.startsWith('n'),
        );
        if (!flightObj) throw new Error('No se encontró el vuelo.');
        return flightObj.time_flight; // Retorna el tiempo de vuelo nacional
      }
    } catch (error) {
      console.log('Error: ', error.message);
      throw new Error('No se encontró el tiempo de vuelo.');
    }
  }

  static calculateArrivalDate(departureDate: Date, flightTime: string) {
    // Convierte la fecha de salida a un objeto Date
    try {
      const departure = new Date(departureDate);

      // Descompone el tiempo de vuelo en horas y minutos
      const [hours, minutes] = flightTime.split(':').map(Number);

      // Calcula la fecha de llegada sumando las horas y minutos del tiempo de vuelo
      const arrival = new Date(departure);
      arrival.setHours(departure.getHours() + hours);
      arrival.setMinutes(departure.getMinutes() + minutes);

      return arrival;
    } catch (error) {
      console.log('Error: ', error.message);
      throw new Error('Error al calcular la fecha de llegada.');
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
    try {
      // Validación inicial de los datos del vuelo
      await this.validation.validateFlightData(flight);

      const {
        creator,
        type,
        origin,
        destination,
        priceFirstClass,
        priceEconomyClass,
        departureDate1,
        lastUpdateDate,
      } = flight;

      // Generación de un código de vuelo único
      let flightCode: string;
      let existingFlight = null;
      do {
        flightCode = FlightClass.codeGenerator(origin, destination);
        existingFlight = await this.prisma.flight.findUnique({
          where: { code: flightCode },
        });
      } while (existingFlight); // Repite hasta encontrar un código único

      // Obtener las ubicaciones de origen y destino
      const typeFlight = type.toLowerCase();
      let locationsFlight: any;
      try {
        locationsFlight = FlightClass.getLocations(
          typeFlight,
          origin,
          destination,
        );
      } catch (error) {
        console.error('Error obteniendo ubicaciones:', error.message);
        throw new HttpException(
          'Error al obtener las ubicaciones del vuelo.',
          400,
        );
      }
      // Obtención del tiempo de vuelo
      const flightTime = FlightClass.flightTime(type, origin, destination);

      // Cálculo de la fecha de llegada
      const arrivalDate1 = FlightClass.calculateArrivalDate(
        departureDate1,
        flightTime,
      );
      // Creación del nuevo vuelo en la base de datos
      const newFlight = await this.prisma.flight.create({
        data: {
          code: flightCode,
          creator,
          type: typeFlight,
          origin: locationsFlight.origin,
          destination: locationsFlight.destination,
          priceFirstClass,
          priceEconomyClass,
          flightTime,
          departureDate1,
          arrivalDate1,
          creationDate: lastUpdateDate,
          lastUpdateDate,
        },
      });

      if (!newFlight) {
        throw new HttpException(
          'No se pudo crear el vuelo, intente de nuevo.',
          500,
        );
      }

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

      // Notificación de la creación del nuevo vuelo
      const departureDate1Colombia = FlightClass.formatDate(departureDate1);
      await this.createNew({
        title: `¡Nuevo vuelo ${typeFlight.startsWith('i') ? 'Internacional' : 'Nacional'}!`,
        content: `De ${locationsFlight.origin} a ${locationsFlight.destination}\n${departureDate1Colombia}\nPrecios desde ${priceEconomyClass} COP por trayecto`,
        creationDate: lastUpdateDate,
      });

      return newFlight;
    } catch (error) {
      console.error('Error en la creación del vuelo:', error.message);
      if (error instanceof HttpException) {
        throw error; // Si ya es una excepción HTTP, la relanza
      }
      throw new HttpException(
        'Error inesperado durante la creación del vuelo.',
        500,
      );
    }
  }

  // Elim
  //Obtener vuelos por parámetro: fecha de vuelo
  async getFlightsByDate(date: Date) {
    const flights = await this.prisma.flight.findMany({
      where: {
        departureDate1: date,
      },
    });
    return flights;
  }
}
