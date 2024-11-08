import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DateTime } from 'luxon';

@Injectable()
export class UtilitiesService {
  codeGenerator(originCode: string, destinationCode: string) {
    const number = Math.floor(Math.random() * 1000);
    return 'SW' + number + originCode + destinationCode;
  }
  getLocationsFile(fileName: string) {
    const filePath = path.join(__dirname, 'locations', `${fileName}.json`);
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData); // Convierte el contenido a un objeto
  }
  getLocations(type: string, originCode: string, destinationCode: string) {
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
  getTimezone(location: string) {
    const locations = this.getLocationsFile('times');
    const modifiedLocation = location.includes('Colombia')
      ? 'Bogotá, Colombia'
      : location;
    const zone = locations.flights.find(
      (city: any) => city.zone === modifiedLocation,
    );
    return zone.timeZone;
  }

  formatDate(date: Date, timeZone = 'UTC') {
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
  getOffsetHours(date: Date | string, timeZone: string): number {
    const dateTime = DateTime.fromISO(date.toString(), { zone: timeZone });
    return dateTime.offset / 60; // Luxon devuelve offset en minutos, así que dividimos entre 60
  }
  // convert a date from a specific timezone to UTC
  convertToUTC(date: Date | string, timeZone: string) {
    const originOffsetHours = this.getOffsetHours(date, timeZone);
    const initialDate = new Date(date);

    // Restar la diferencia horaria del origen para obtener la hora UTC correcta
    initialDate.setHours(initialDate.getHours() - originOffsetHours);

    return initialDate;
  }

  validateMinimumTime(
    currentDateUTC: Date,
    departureDateUTC: Date,
    minimumTime: number,
  ) {
    const currentDate = DateTime.fromJSDate(currentDateUTC);
    const departureDate = DateTime.fromJSDate(departureDateUTC);

    const differenceInHours = departureDate.diff(currentDate, 'hours').hours;
    return differenceInHours >= minimumTime;
  }
  flightTime(type: string, origin: string, destination: string) {
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

  calculateArrivalDate(departureDate: Date, flightTime: string) {
    // Convierte el tiempo de vuelo en horas y minutos
    const [hours, minutes] = flightTime.split(':').map(Number);

    // Usa Luxon para manejar la fecha de salida y sumar el tiempo de vuelo
    const arrivalDate = DateTime.fromJSDate(departureDate)
      .plus({ hours, minutes }) // Suma horas y minutos
      .toJSDate(); // Retorna en formato Date compatible con JavaScript

    return arrivalDate;
  }
}
