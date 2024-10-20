import { Injectable, HttpException } from '@nestjs/common';
import {
  Credentials,
  UserName,
  PasswordChange,
} from './interfaces/credentials.interface';
import { User } from './interfaces/user.interface';
import { PrismaService } from '../prisma.service';
import { ValidationService } from '../validation/validation.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private validationUser: ValidationService,
  ) {}

  async findAllUsers() {
    return this.prisma.user.findMany();
  }

  async findAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN', erased: false },
    });
  }

  async createAdmin(user: Credentials): Promise<any> {
    await this.validationUser.validateCredentials(user);

    const { username, email, password } = user;

    // Verificar si el username ya existe
    const existingUser = await this.prisma.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      throw new HttpException('Nombre de usuario en uso', 409);
    }

    // Verificar si el email ya existe
    const existingEmail = await this.prisma.user.findFirst({
      where: { email },
    });
    if (existingEmail) {
      throw new HttpException('Correo electrónico en uso', 409);
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    return {
      username: newUser.username,
      role: newUser.role,
    };
  }

  async changePassword(userData: PasswordChange): Promise<any> {
    const { username, currentPassword, newPassword } = userData;
    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });
    // Verificar si el usuario existe
    if (!user) {
      throw new HttpException('Usuario no encontrado', 404);
    }
    // Verificar si la contraseña actual es correcta
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      throw new HttpException(
        'La contraseña actual ingresada es incorrecta',
        400,
      );
    }
    // Validar la nueva contraseña
    this.validationUser.validatePasswordChange(newPassword);
    // Encriptar la nueva contraseña y actualizarla
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { username: username },
      data: { password: hashedPassword },
    });

    return true;
  }

  async updateData(userData: User): Promise<any> {
    const {
      username,
      name1,
      name2,
      surname1,
      surname2,
      gender,
      address,
      birthPlace,
      birthDate,
      user_image,
    } = userData;
    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });
    // Verificar si el usuario existe
    if (!user) {
      throw new HttpException('Usuario no encontrado', 404);
    }
    // Validar los datos del enviados por el usuario
    // await this.validationUser.validateUserData(userData);
    // Actualizar los datos del usuario
    const updatedUser = await this.prisma.user.update({
      where: { username: username },
      data: {
        name1,
        name2,
        surname1,
        surname2,
        gender,
        address,
        birthPlace,
        birthDate: new Date(birthDate),
        image: user_image,
      },
    });
    return {
      username: updatedUser.username,
      email: updatedUser.email,
    };
  }

  async findUser(username: UserName): Promise<User> {
    console.log('User maybe -> ', username);
    const user = await this.prisma.user.findUnique({
      where: { username: username.username },
    });
    console.log(user);
    if (!user) {
      throw new HttpException('Usuario no encontrado', 404);
    }
    const response: User = {
      username: user.username,
      password: user.password,
      role: user.role,
      dni: user.dni || '',
      name1: user.name1 || '',
      name2: user.name2 || '',
      surname1: user.surname1 || '',
      surname2: user.surname2 || '',
      email: user.email || '',
      gender: user.gender || '',
      address: user.address || '',
      birthPlace: user.birthPlace || '',
      birthDate: new Date(user.birthDate) || null,
      user_image: user.image || '',
    };
    return response;
  }

  async delete(username: UserName): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.username },
    });
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const deletedUser = await this.prisma.user.update({
      where: { username: username.username },
      data: { erased: true },
    });
    return {
      username: deletedUser.username,
      email: deletedUser.email,
    };
  }
}
