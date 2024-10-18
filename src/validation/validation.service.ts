import { Injectable, HttpException } from '@nestjs/common';
import { Credentials } from '../users/interfaces/credentials.interface';
import { User } from '../users/interfaces/user.interface';
import e from 'express';
import { log } from 'console';
import { min } from 'rxjs';

class Validator {
  static validateStringLength(
    value: string,
    min: number,
    max: number,
    fieldName: string,
    errors: string[],
  ) {
    if (value.length < min || value.length > max) {
      errors.push(
        `${fieldName} debe contener entre ${min} y ${max} caracteres.`,
      );
    }
  }

  static validateNoSpaces(value: string, fieldName: string, errors: string[]) {
    if (value.includes(' ')) {
      errors.push(`${fieldName} no puede contener espacios.`);
    }
  }

  static validateEmailStructure(email: string, errors: string[]) {
    if (!email.includes('@') || email.includes(' ')) {
      errors.push('Correo electrónico no válido.');
    }
  }

  static validateAge(birthDate: string, errors: string[]) {
    const birthYear = new Date(birthDate).getFullYear();
    const actualYear = new Date().getFullYear();
    const age = actualYear - birthYear;
    if (age < 18 || age > 90) {
      errors.push('Edad no permitida. Debe estar entre 18 y 90 años.');
    }
  }

  static validateNames(names: string[], errors: string[]) {
    let length = false;
    let spaces = false;
    names.forEach((name) => {
      if (!length && name && (name.length < 3 || name.length > 20)) {
        length = true;
      }
      if (!spaces && name && name.includes(' ')) {
        spaces = true;
      }
    });
    if (length) {
      errors.push(
        'Los nombres y apellidos deben contener entre 3 y 20 caracteres.',
      );
    }
    if (spaces) {
      errors.push('Los nombres y apellidos no pueden contener espacios.');
    }
  }

  static compareDates(
    date1: string,
    date2: string,
    label1: string,
    label2: string,
    errors: string[],
  ) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    if (d1 >= d2) {
      errors.push(
        `La fecha de ${label1} debe ser menor a la fecha de ${label2}.`,
      );
    }
  }
}

@Injectable()
export class ValidationService {
  async validateCredentials(user: Credentials): Promise<any> {
    const { username, email, password } = user;
    const errors: string[] = [];

    // Validaciones
    Validator.validateStringLength(
      username,
      5,
      20,
      'Nombre de usuario',
      errors,
    );
    Validator.validateNoSpaces(username, 'Nombre de usuario', errors);
    Validator.validateEmailStructure(email, errors);
    Validator.validateStringLength(password, 8, 20, 'Contraseña', errors);
    Validator.validateNoSpaces(password, 'Contraseña', errors);

    if (errors.length > 0) {
      throw new HttpException(errors.join(', '), 400);
    }

    return true;
  }

  async validateUserData(user: User): Promise<any> {
    const {
      username,
      password,
      name1,
      name2,
      surname1,
      surname2,
      email,
      birthDate,
    } = user;
    const errors: string[] = [];

    // Validaciones comunes
    await this.validateCredentials({ username, email, password });

    // Validaciones adicionales
    Validator.validateNames([name1, name2, surname1, surname2], errors);
    Validator.validateAge(String(birthDate), errors);

    if (errors.length > 0) {
      throw new HttpException(errors.join(', '), 400);
    }

    return true;
  }
  async validatePasswordChange(newPassword: string): Promise<any> {
    const errors: string[] = [];
    Validator.validateStringLength(newPassword, 8, 20, 'Contraseña', errors);
    Validator.validateNoSpaces(newPassword, 'Contraseña', errors);
    if (errors.length > 0) {
      throw new HttpException(errors.join(', '), 400);
    }
    return true;
  }

  async validateFlightData(flight: any): Promise<any> {
    const {
      origin,
      destination,
      type,
      departureDate1,
      departureDate2,
      arrivalDate1,
      arrivalDate2,
      priceEconomyClass,
      priceFirstClass,
      creationDate,
    } = flight;
    const errors: string[] = [];

    // Validaciones
    // Comprobar si el origen y destino son iguales
    if (origin === destination) {
      errors.push('Origen y destino no pueden ser iguales.');
    }
    // Validar que la fecha de creación sea menor a la fecha de salida
    const creation = new Date(creationDate);
    const departure1 = new Date(departureDate1);
    const diff = departure1.getTime() - creation.getTime();
    const diffHours = diff / (1000 * 60 * 60);
    const minimumTime = type.toLowerCase()[0] === 'n' ? 1 : 3;
    if (diffHours < minimumTime) {
      errors.push(
        `La fecha de creación del vuelo debe ser al menos ${minimumTime} hora(s) antes de la fecha de salida.`,
      );
    }
    // Comprobar si las fechas de ida y vuelta son correctas
    Validator.compareDates(
      departureDate1,
      departureDate2,
      'ida',
      'vuelta',
      errors,
    );
    const typeFlight = type.toLowerCase();
    if (typeFlight === 'international') {
      // Validar la fecha de retorno sea mayor a la de ida
      if (arrivalDate1 && arrivalDate2) {
        Validator.compareDates(
          departureDate1,
          arrivalDate2,
          'ida',
          'llegada del vuelo de retorno',
          errors,
        );
        // Validar la fecha de salida del vuelo de retorno sea mayor a la de llegada
        Validator.compareDates(
          arrivalDate1,
          departureDate2,
          'llegada del vuelo de ida',
          'salida del vuelo de retorno',
          errors,
        );
        // Validar que las fechas de llegada no tengan más de 38 horas de diferencia con respecto a la salida
        // Este valor de 38 horas se toma basado en que para los vuelos disponibles el tiempo máximo de vuelo de 12 horas
        // y la mayor diferencia horaria entre países es de 26 horas
        const departure1 = new Date(departureDate1);
        const arrival1 = new Date(arrivalDate1);
        const diff = Math.abs(departure1.getTime() - arrival1.getTime());
        const diffHours = Math.ceil(diff / (1000 * 60 * 60));
        if (diffHours > 38) {
          errors.push(
            'La fecha de llegada del vuelo internacional de ida deben tener como máximo 38 horas de diferencia con la fecha de salida.',
          );
        }
        const departure2 = new Date(departureDate2);
        const arrival2 = new Date(arrivalDate2);
        const diff2 = Math.abs(departure2.getTime() - arrival2.getTime());
        const diffHours2 = Math.ceil(diff2 / (1000 * 60 * 60));
        if (diffHours2 > 38) {
          errors.push(
            'La fecha de llegada del vuelo internacional de vuelta deben tener como máximo 38 horas de diferencia con la fecha de salida.',
          );
        }
      } else {
        errors.push(
          'Debe ingresar las fechas de llegada para los vuelos internacionales.',
        );
      }
    }
    // Validar precios, deben ser mayores a 0
    if (priceEconomyClass <= 0 || priceFirstClass <= 0) {
      errors.push('Los precios deben ser mayores a 0.');
    }
    // El precio de la clase económica debe ser menor al de primera clase
    if (priceEconomyClass >= priceFirstClass) {
      errors.push(
        'El precio de la clase económica debe ser menor al de primera clase.',
      );
    }
    if (errors.length > 0) {
      throw new HttpException(errors.join(', '), 400);
    }
    return true;
  }
}
