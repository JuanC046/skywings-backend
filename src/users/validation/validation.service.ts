import { Injectable, HttpException } from '@nestjs/common';
import { Credentials, UserName } from '../interfaces/credentials.interface';
import { User } from '../interfaces/user.interface';

@Injectable()
export class ValidationService {
  async validateCredentials(user: Credentials): Promise<any> {
    // Vereficar que los elementos cumplen con los requisitos
    const { username, email, password } = user;
    if (!username || !email || !password) {
      throw new HttpException('Faltan elementos', 400);
    }
    if (username.length < 5 || username.length > 20) {
      throw new HttpException(
        'El nombre de usuario debe contener entre 5 y 20 caracteres',
        400,
      );
    }
    if (username.includes(' ')) {
      throw new HttpException(
        'El nombre de usuario no puede contener espacios',
        400,
      );
    }
    // Verificar si tiene estructura de email
    if (!email.includes('@') || email.includes(' ')) {
      throw new HttpException('Correo electrónico no válido', 400);
    }
    // Verficación de contraseña
    if (password.length < 8 || password.length > 20) {
      throw new HttpException(
        'La contraseña debe contener entre 8 y 20 caracteres',
        400,
      );
    }
    if (password.includes(' ')) {
      throw new HttpException('La contraseña no puede contener espacios', 400);
    }
    return true;
  }
  async validateUserData(user: User): Promise<any> {
    const {
      username,
      password,
      role,
      dni,
      name1,
      name2,
      surname1,
      surname2,
      email,
      gender,
      address,
      birthPlace,
      birthDate,
      user_image,
    } = user;
    if (
      !username ||
      !password ||
      !role ||
      !dni ||
      !name1 ||
      !surname1 ||
      !email ||
      !gender ||
      !address ||
      !birthPlace ||
      !birthDate
    ) {
      throw new HttpException('Faltan elementos', 400);
    }
    if (username.length < 5 || username.length > 20) {
      throw new HttpException(
        'El nombre de usuario debe contener entre 5 y 20 caracteres',
        400,
      );
    }
    if (username.includes(' ')) {
      throw new HttpException(
        'El nombre de usuario no puede contener espacios',
        400,
      );
    }
    // Verificar si tiene estructura de email
    if (!email.includes('@') || email.includes(' ')) {
      throw new HttpException('Correo electrónico no válido', 400);
    }
    // Verficación de contraseña
    if (password.length < 8 || password.length > 20) {
      throw new HttpException(
        'La contraseña debe contener entre 8 y 20 caracteres',
        400,
      );
    }
    if (password.length < 8 || password.length > 20) {
      throw new HttpException(
        'La contraseña debe contener entre 8 y 20 caracteres',
        400,
      );
    }
    // Verificación de Contraseña
    if (password.includes(' ')) {
      throw new HttpException('La contraseña no puede contener espacios', 400);
    }
    // Verificación de nombres y apellidos
    if (
      name1.length < 3 ||
      surname1.length < 3 ||
      (name2 && name2.length < 3) ||
      (surname2 && surname2.length < 3)
    ) {
      throw new HttpException(
        'Los nombres y apellidos deben contener al menos 3 caracteres',
        400,
      );
    }
    if (name1.includes(' ') || surname1.includes(' ')) {
      throw new HttpException(
        'Los nombres y apellidos no pueden contener espacios',
        400,
      );
    }
    if (
      (name2 && name2.includes(' ')) ||
      (surname2 && surname2.includes(' '))
    ) {
      throw new HttpException(
        'Los nombres y apellidos no pueden contener espacios',
        400,
      );
    }
    // Verificación de edad-> 18 >= edad <= 90
    const birthYear = new Date(birthDate).getFullYear();
    const actualYear = new Date().getFullYear();
    if (actualYear - birthYear < 18 || actualYear - birthYear > 90) {
      throw new HttpException('Edad no permitida', 400);
    }
    return true;
  }
}
