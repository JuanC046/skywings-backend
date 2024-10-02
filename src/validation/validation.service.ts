import { Injectable, HttpException } from '@nestjs/common';
import { Credentials } from '../users/interfaces/credentials.interface';
import { User } from '../users/interfaces/user.interface';

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
}