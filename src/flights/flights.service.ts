import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  Flight,
  Seats,
  OriginDestination,
} from './interfaces/flight.interface';
import { ValidationService } from '../validation/validation.service';
import { HttpException } from '@nestjs/common';
import { NewsService } from './news.service';
import { UtilitiesService } from './utilities.service';

@Injectable()
export class FlightsService {
  constructor(
    private prisma: PrismaService,
    private validation: ValidationService,
    private newsService: NewsService,
    private utilities: UtilitiesService,
  ) {}

  async findActualFlights() {
    const currentDate = new Date();
    const flights = await this.prisma.flight.findMany({
      where: { erased: false, departureDate1: { gt: currentDate } },
    });
    if (!flights) {
      throw new HttpException('No se encontraron vuelos.', 404);
    }
    return flights;
  }

  async findAllNews() {
    return await this.newsService.AllNews();
  }

  private async createSeatsConfiguration(
    flightCode: string,
    typeFlight: string,
  ) {
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
      const timeZone = this.utilities.getTimezone(locationsFlight.origin);
      // Convertir la fecha de salida a UTC
      const departureDateUTC = this.utilities.convertToUTC(
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
      const flightTime = this.utilities.flightTime(type, origin, destination);

      // Cálculo de la fecha de llegada
      const arrivalDate1 = this.utilities.calculateArrivalDate(
        departureDateUTC,
        flightTime,
      );

      // Creación del nuevo vuelo en la base de datos
      const newFlight = await this.createFlightInDatabase({
        flightCode,
        creator,
        updater: creator,
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
      return this.utilities.getLocations(typeFlight, origin, destination);
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
      !this.utilities.validateMinimumTime(
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
      flightCode = this.utilities.codeGenerator(origin, destination);
      existingFlight = await this.prisma.flight.findUnique({
        where: { code: flightCode },
      });
    } while (existingFlight); // Repite hasta encontrar un código único
    return flightCode;
  }

  private async createFlightInDatabase({
    flightCode,
    creator,
    updater,
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
          updater,
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
    const timeZone = this.utilities.getTimezone(origin);
    const departureDate1Origin = this.utilities.formatDate(
      departureDate1,
      timeZone,
    );
    await this.newsService.createNew({
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
    const {
      origin,
      destination,
      departureDate1,
      priceEconomyClass,
      priceFirstClass,
    } = flight;
    const timeZone = this.utilities.getTimezone(origin);
    const departureDate1Origin = this.utilities.formatDate(
      departureDate1,
      timeZone,
    );
    await this.newsService.createNew({
      title: `¡Nuevos precios!`,
      content: `Vuelo de ${origin} a ${destination}\nFecha del vuelo ${departureDate1Origin} hora ${origin}\nPrecios actualizados\nPrecio clase económica: ${priceEconomyClass} COP\nPrecio primera clase: ${priceFirstClass} COP`,
      creationDate: new Date(),
    });
  }
  async changeFlightPrice(flightData: any): Promise<any> {
    const {
      flightCode,
      priceEconomyClass: newPriceEconomyClass,
      priceFirstClass: newPriceFirstClass,
      updater,
    } = flightData;
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
          updater: updater,
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
  async findFlightsRealized() {
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
  // Obtener vuelos de un origen y destino específico
  async findFlightsByRoute(originDestination: OriginDestination) {
    const { origin, destination } = originDestination;
    const flights = await this.prisma.flight.findMany({
      where: { origin, destination, erased: false },
      select: { origin: true, destination: true, departureDate1: true },
    });
    if (!flights) {
      throw new HttpException('No se encontraron vuelos.', 404);
    }
    return flights;
  }
  // Obtener la información de asientos de un vuelo
  async findSeatsByFlight(flightCode: string) {
    const seats = await this.prisma.seats.findUnique({
      where: { flightCode },
    });
    if (!seats) {
      throw new HttpException('No se encontraron asientos.', 404);
    }
    return seats;
  }
}
