import { Passenger } from './interfaces/passenger.interface';
import { PrismaService } from '../prisma.service';
import { HttpException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PassengerService {
  constructor(private prisma: PrismaService) {}
  private valideteAge(birthdate: Date) {
    // Retornar true si la persona es mayor de 18 años
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    if (age > 18) {
      return true;
    }
    return false;
  }
  validatePassengersAges(passengers: Passenger[]) {
    // Validar que al menos un pasajero sea mayor de 18 años
    for (const passenger of passengers) {
      if (this.valideteAge(passenger.birthdate)) {
        return true;
      }
    }
    return false;
  }
  // Obtener listado de pasajeros de un vuelo por su dni
  async getPassengersByFlightCode(passengersDni: string[], flightCode: string) {
    try {
      const passengers: Passenger[] = await this.prisma.passenger.findMany({
        where: {
          dni: {
            in: passengersDni,
          },
          flightCode,
        },
      });
      return passengers;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al obtener los pasajeros.', 500);
    }
  }
  private async passengerExist(dni: string, flightCode: string) {
    const passengerExist = await this.getPassengersByFlightCode(
      [dni],
      flightCode,
    );
    if (passengerExist.length > 0) {
      throw new HttpException(
        `El pasajero ${dni} ya existe en el vuelo ${flightCode}.`,
        400,
      );
    }
  }
  async createPassegerInDataBase(passenger: Passenger) {
    await this.passengerExist(passenger.dni, passenger.flightCode);
    try {
      const createdPassenger = await this.prisma.passenger.create({
        data: {
          dni: passenger.dni,
          flightCode: passenger.flightCode,
          name1: passenger.name1,
          name2: passenger.name2,
          surname1: passenger.surname1,
          surname2: passenger.surname2,
          birthdate: passenger.birthdate,
          gender: passenger.gender,
          phone: passenger.phone,
          email: passenger.email,
          contactName: passenger.contactName,
          contactPhone: passenger.contactPhone,
        },
      });
      return createdPassenger;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al crear el pasajero.', 500);
    }
  }
}
