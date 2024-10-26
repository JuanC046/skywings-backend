import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Flight, Seats } from './interfaces/flight.interface';
import { New } from './interfaces/new.interface';
import { ValidationService } from '../validation/validation.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { addHours, addMinutes } from 'date-fns';

class FlightClass {
  constructor(private prisma: PrismaService) {}

  static codeGenerator(originCode: string, destinationCode: string) {
    const number = Math.floor(Math.random() * 1000);
    return 'SW' + number + originCode + destinationCode;
  }
  static getLocationsFile(fileName: string) {
    const filePath = path.join(__dirname, 'locations', `${fileName}.json`);
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData); // Convierte el contenido a un objeto
  }
  static getLocations(
    type: string,
    originCode: string,
    destinationCode: string,
  ) {
    // Obtiene las ubicaciones según el tipo
    const locations = this.getLocationsFile(type);

    // Función auxiliar para buscar una ubicación por código
    const findLocation = (locationsList: any[], code: string) => {
      return locationsList.find((location: any) => location.code === code);
    };

    let origin = null;
    let destination = null;

    // Busca el origen (en el caso de vuelos internacionales puede estar tanto en 'colombia' como en 'international')
    if (type === 'national') {
      origin = findLocation(locations.capitals, originCode);
      destination = findLocation(locations.capitals, destinationCode);
    } else if (type === 'international') {
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
    return formatedDate;
  }

  static flightTime(type: string, origin: string, destination: string) {
    // Obtiene el archivo de tiempos de vuelo
    const times = this.getLocationsFile('times');

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
        return flightObj.flight_time;
      } else {
        // Si es vuelo nacional
        const flightObj = times.flights.find((flight: any) =>
          flight.type.startsWith('n'),
        );
        if (!flightObj) throw new Error('No se encontró el vuelo.');
        return flightObj.flight_time;
      } // Retorna el tiempo de vuelo nacional
    } catch (error) {
      console.error(error.message);
      throw new Error('No se encontró el tiempo de vuelo.');
    }
  }

  static calculateArrivalDate(departureDate: Date, flightTime: string) {
    try {
      // Convierte la fecha de salida al formato UTC
      const departure = new Date(departureDate);

      // Descompone el tiempo de vuelo en horas y minutos
      const [hours, minutes] = flightTime.split(':').map(Number);

      // Calcula la fecha de llegada en UTC sumando las horas y minutos del tiempo de vuelo
      let arrival = addHours(departure, hours);
      arrival = addMinutes(arrival, minutes);

      return arrival;
    } catch (error) {
      console.error('Error:', error.message);
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
      console.error('Error al crear la noticia: ', error.message);
      throw new Error(error.message);
    }
  }
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
      const typeFlight = type.toLowerCase().startsWith('i')
        ? 'international'
        : 'national';
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
          `Error obteniendo ubicaciones: ${error.message}`,
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

      // Llamada a la función de creación de asientos
      await this.createSeatsConfiguration(flightCode, typeFlight);

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
  async notifyPassangers(flightCode: string, message: string) {
    console.log(message, flightCode);
  }
  // Eliminar/cancelar vuelo
  async deleteFlight(flightCode: string, currentDate: Date) {
    // Buscar el vuelo a eliminar
    const flight = await this.prisma.flight.findUnique({
      where: { code: flightCode },
    });
    // Verificar si el vuelo existe
    if (!flight) {
      throw new HttpException('Vuelo no encontrado.', 404);
    }
    currentDate = new Date(currentDate);
    const departureDate = new Date(flight.departureDate1);
    // Verificar que el vuelo no haya salido
    if (departureDate <= currentDate) {
      throw new HttpException(
        'No se puede cancelar un vuelo realizado o a punto de salir.',
        400,
      );
    }
    // Verificar si el vuelo ya fue cancelado
    if (flight.erased) {
      throw new HttpException('El vuelo ya fue cancelado.', 400);
    }
    // Borrado lógico del vuelo, asientos y notificar a los pasajeros
    try {
      await this.prisma.flight.update({
        where: { code: flightCode },
        data: { erased: true, lastUpdateDate: currentDate },
      });
      await this.prisma.seats.update({
        where: { flightCode },
        data: { erased: true },
      });
      await this.notifyPassangers(flightCode, 'Vuelo cancelado.');
      return true;
    } catch (error) {
      console.error('Error al cancelar el vuelo:', error.message);
      throw new HttpException('Error al cancelar el vuelo.', 500);
    }
  }
  async changeFlightPrice(
    flightCode: string,
    newPriceEconomyClass: number,
    newPriceFirstClass: number,
    currentDate: Date,
  ) {
    // Buscar el vuelo a editar
    const flight = await this.prisma.flight.findUnique({
      where: { code: flightCode },
    });
    // Verificar si el vuelo existe
    if (!flight) {
      throw new HttpException('Vuelo no encontrado.', 404);
    }
    currentDate = new Date(currentDate);
    const departureDate = new Date(flight.departureDate1);
    // Verificar que el vuelo no haya salido
    if (departureDate <= currentDate) {
      throw new HttpException(
        'No se puede editar el precio de un vuelo realizado o a punto de salir.',
        400,
      );
    }
    // Verificar si el vuelo ya fue cancelado
    if (flight.erased) {
      throw new HttpException(
        'El vuelo ya fue cancelado, no se puede cambiar su precio.',
        400,
      );
    }
    // Validar los precios
    if (newPriceEconomyClass <= 0 || newPriceFirstClass <= 0) {
      throw new HttpException('Los precios deben ser mayores a 0.', 400);
    }
    if (newPriceEconomyClass >= newPriceFirstClass) {
      throw new HttpException(
        'El precio de la clase económica debe ser menor al de primera clase.',
        400,
      );
    }
    // Actualizar los precios del vuelo
    try {
      const updateFlight = await this.prisma.flight.update({
        where: { code: flightCode },
        data: {
          priceEconomyClass: newPriceEconomyClass,
          priceFirstClass: newPriceFirstClass,
          lastUpdateDate: currentDate,
        },
      });
      return updateFlight;
    } catch (error) {
      console.error('Error al cambiar el precio del vuelo:', error.message);
      throw new HttpException('Error al cambiar el precio del vuelo.', 500);
    }
  }
  //Obtener vuelos por parámetro: fecha de vuelo
  // async getFlightsByDate(date: Date) {
  //   const flights = await this.prisma.flight.findMany({
  //     where: {
  //       departureDate1: date,
  //     },
  //   });
  //   return flights;
  // }
}
