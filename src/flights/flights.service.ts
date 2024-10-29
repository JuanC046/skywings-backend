import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Flight, Seats } from './interfaces/flight.interface';
import { New } from './interfaces/new.interface';
import { ValidationService } from '../validation/validation.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { time } from 'console';
class FlightClass {
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
  // get the timezone of a specific location
  static getTimezone(location: string) {
    const locations = this.getLocationsFile('times');
    const modifiedLocation = location.includes('Colombia')
      ? 'Bogotá, Colombia'
      : location;
    const zone = locations.flights.find(
      (city: any) => city.zone === modifiedLocation,
    );
    return zone.timeZone;
  }

  static formatDate(date: Date, timeZone = 'UTC') {
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
      timeZone, // Mantiene la hora sin convertirla a la zona local
    };

    // Mostrar la fecha formateada en el formato colombiano
    const formatedDate = new Intl.DateTimeFormat('es-CO', formatOptions).format(
      newDate,
    );
    return formatedDate;
  }
  static getOffsetHours(date: Date | string, timeZone: string): number {
    const dateTime = DateTime.fromISO(date.toString(), { zone: timeZone });
    return dateTime.offset / 60; // Luxon devuelve offset en minutos, así que dividimos entre 60
  }
  // convert a date from a specific timezone to UTC
  static convertToUTC(date: Date | string, timeZone: string) {
    const originOffsetHours = this.getOffsetHours(date, timeZone);
    const initialDate = new Date(date);

    // Restar la diferencia horaria del origen para obtener la hora UTC correcta
    initialDate.setHours(initialDate.getHours() - originOffsetHours);

    return initialDate;
  }
  // convert a date from UTC to a specific timezone and chaging the time
  static convertFromUTC(date: Date | string, timeZone: string): Date {
    const dateTimeUTC = DateTime.fromISO(date.toString(), { zone: 'UTC' });
    const dateInTimeZone = dateTimeUTC.setZone(timeZone);

    return dateInTimeZone.toJSDate();
  }
  static validateMinimumTime(
    currentDateUTC: Date,
    departureDateUTC: Date,
    minimumTime: number,
  ) {
    const currentDate = DateTime.fromJSDate(currentDateUTC);
    const departureDate = DateTime.fromJSDate(departureDateUTC);

    const differenceInHours = departureDate.diff(currentDate, 'hours').hours;
    return differenceInHours >= minimumTime;
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
        return flightObj.flightTime;
      } else {
        // Si es vuelo nacional
        const flightObj = times.flights.find((flight: any) =>
          flight.type.startsWith('n'),
        );
        if (!flightObj) throw new Error('No se encontró el vuelo.');
        return flightObj.flightTime;
      } // Retorna el tiempo de vuelo nacional
    } catch (error) {
      console.error(error.message);
      throw new Error('No se encontró el tiempo de vuelo.');
    }
  }

  static calculateArrivalDate(departureDate: Date, flightTime: string) {
    // Convierte el tiempo de vuelo en horas y minutos
    const [hours, minutes] = flightTime.split(':').map(Number);

    // Usa Luxon para manejar la fecha de salida y sumar el tiempo de vuelo
    const arrivalDate = DateTime.fromJSDate(departureDate)
      .plus({ hours, minutes }) // Suma horas y minutos
      .toJSDate(); // Retorna en formato Date compatible con JavaScript

    return arrivalDate;
  }
}
@Injectable()
export class FlightsService {
  constructor(
    private prisma: PrismaService,
    private validation: ValidationService,
  ) {}

  async findAllFlights() {
    const flights = await this.prisma.flight.findMany();
    if (!flights) {
      throw new HttpException('No se encontraron vuelos.', 404);
    }
    return flights;
  }

  async findAllNews() {
    const news = await this.prisma.news.findMany();
    if (!news) {
      throw new HttpException('No se encontraron noticias.', 404);
    }
    return news;
  }
  private async createNew(newData: New): Promise<any> {
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
      } = flight;

      // Normalize type flight
      const typeFlight = type.toLowerCase().startsWith('i')
        ? 'international'
        : 'national';

      // Obtener las ubicaciones de origen y destino
      const locationsFlight = this.getLocationsFlight(
        typeFlight,
        origin,
        destination,
      );

      // Obtener la fecha actual en UTC
      const currentDateUTC = new Date();
      // Obtener zona horaria del origen del vuelo
      const timeZone = FlightClass.getTimezone(locationsFlight.origin);
      // Convertir la fecha de salida a UTC
      const departureDateUTC = FlightClass.convertToUTC(
        departureDate1,
        timeZone,
      );
      // Validar que la fecha de salida cumpla con el tiempo mínimo
      this.validateDepartureDate(currentDateUTC, departureDateUTC, typeFlight);

      // Generación de un código de vuelo único
      const flightCode = await this.generateUniqueFlightCode(
        origin,
        destination,
      );

      // Obtención del tiempo de vuelo
      const flightTime = FlightClass.flightTime(type, origin, destination);

      // Cálculo de la fecha de llegada
      const arrivalDate1 = FlightClass.calculateArrivalDate(
        departureDateUTC,
        flightTime,
      );

      // Creación del nuevo vuelo en la base de datos
      const newFlight = await this.createFlightInDatabase({
        flightCode,
        creator,
        typeFlight,
        locationsFlight,
        priceFirstClass,
        priceEconomyClass,
        flightTime,
        departureDateUTC,
        arrivalDate1,
        currentDateUTC,
      });

      // Llamada a la función de creación de asientos
      await this.createSeatsConfiguration(flightCode, typeFlight);

      // Notificación de la creación del nuevo vuelo
      await this.notifyNewFlightCreation(newFlight);

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

  private getLocationsFlight(
    typeFlight: string,
    origin: string,
    destination: string,
  ) {
    try {
      return FlightClass.getLocations(typeFlight, origin, destination);
    } catch (error) {
      console.error('Error obteniendo ubicaciones:', error.message);
      throw new HttpException(
        `Error obteniendo ubicaciones: ${error.message}`,
        400,
      );
    }
  }

  private validateDepartureDate(
    currentDateUTC: Date,
    departureDateUTC: Date,
    typeFlight: string,
  ) {
    const minimumTime = typeFlight === 'national' ? 2 : 4;
    if (
      !FlightClass.validateMinimumTime(
        currentDateUTC,
        departureDateUTC,
        minimumTime,
      )
    ) {
      throw new HttpException(
        `La fecha de salida debe ser al menos ${minimumTime} horas después de la fecha actual.`,
        400,
      );
    }
  }

  private async generateUniqueFlightCode(
    origin: string,
    destination: string,
  ): Promise<string> {
    let flightCode: string;
    let existingFlight = null;
    do {
      flightCode = FlightClass.codeGenerator(origin, destination);
      existingFlight = await this.prisma.flight.findUnique({
        where: { code: flightCode },
      });
    } while (existingFlight); // Repite hasta encontrar un código único
    return flightCode;
  }

  private async createFlightInDatabase({
    flightCode,
    creator,
    typeFlight,
    locationsFlight,
    priceFirstClass,
    priceEconomyClass,
    flightTime,
    departureDateUTC,
    arrivalDate1,
    currentDateUTC,
  }: any) {
    try {
      return await this.prisma.flight.create({
        data: {
          code: flightCode,
          creator,
          type: typeFlight,
          origin: locationsFlight.origin,
          destination: locationsFlight.destination,
          priceFirstClass,
          priceEconomyClass,
          flightTime,
          departureDate1: departureDateUTC,
          arrivalDate1: arrivalDate1,
          creationDate: currentDateUTC,
          lastUpdateDate: currentDateUTC,
        },
      });
    } catch (error) {
      console.error('Error al crear el vuelo:', error.message);
      throw new HttpException(
        'No se pudo crear el vuelo, intente de nuevo.',
        500,
      );
    }
  }

  private async notifyNewFlightCreation(newFlight: Flight) {
    const {
      type,
      origin,
      destination,
      departureDate1,
      priceEconomyClass,
      creationDate,
    } = newFlight;
    const timeZone = FlightClass.getTimezone(origin);
    const departureDate1Origin = FlightClass.formatDate(
      departureDate1,
      timeZone,
    );
    await this.createNew({
      title: `¡Nuevo vuelo ${type.startsWith('i') ? 'Internacional' : 'Nacional'}!`,
      content: `De ${origin} a ${destination}\n${departureDate1Origin} hora ${origin}\nPrecios desde ${priceEconomyClass} COP por trayecto`,
      creationDate,
    });
  }
  async notifyPassangers(flightCode: string, message: string) {
    console.log(message, flightCode);
  }
  // Eliminar/cancelar vuelo
  async deleteFlight(flightCode: string) {
    // Buscar el vuelo a eliminar
    const flight = await this.prisma.flight.findUnique({
      where: { code: flightCode },
    });
    // Verificar si el vuelo existe
    if (!flight) {
      throw new HttpException('Vuelo no encontrado.', 404);
    }
    const currentDate = new Date();
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
  private async notifyNewFlightPrice(flight: Flight) {
    const { origin, destination, departureDate1, priceEconomyClass, priceFirstClass } = flight;
    const timeZone = FlightClass.getTimezone(origin);
    const departureDate1Origin = FlightClass.formatDate(
      departureDate1,
      timeZone,
    );
    await this.createNew({
      title: `¡Nuevos precios!`,
      content: `Vuelo de ${origin} a ${destination}\nFecha del vuelo ${departureDate1Origin} hora ${origin}\nPrecios actualizados\nPrecio clase económica: ${priceEconomyClass} COP\nPrecio primera clase: ${priceFirstClass} COP`,
      creationDate: new Date(),
    });
  }
  async changeFlightPrice(
    flightCode: string,
    newPriceEconomyClass: number,
    newPriceFirstClass: number,
  ) {
    // Buscar el vuelo a editar
    const flight = await this.prisma.flight.findUnique({
      where: { code: flightCode },
    });
    // Verificar si el vuelo existe
    if (!flight) {
      throw new HttpException('Vuelo no encontrado.', 404);
    }
    const currentDate = new Date();
    const departureDate = new Date(flight.departureDate1);
    // Verificar si el vuelo ya fue cancelado
    if (flight.erased) {
      throw new HttpException(
        'El vuelo ya fue cancelado, no se puede cambiar su precio.',
        400,
      );
    }
    // Verificar que el vuelo no haya salido
    if (departureDate <= currentDate) {
      throw new HttpException(
        'No se puede editar el precio de un vuelo realizado o a punto de salir.',
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
      // Noticia de cambio de precios
      await this.notifyNewFlightPrice(updateFlight);
      return updateFlight;
    } catch (error) {
      console.error('Error al cambiar el precio del vuelo:', error.message);
      throw new HttpException('Error al cambiar el precio del vuelo.', 500);
    }
  }
  // Obtener los vuelos realizados
  async getFlightsRealized() {
    const currentDate = new Date();

    const realizedFights = await this.prisma.flight.findMany({
      where: {
        departureDate1: { lt: currentDate },
        erased: false,
      },
    });
    if (!realizedFights) {
      throw new HttpException('No se encontraron vuelos realizados.', 404);
    }
    return realizedFights;
  }
}
