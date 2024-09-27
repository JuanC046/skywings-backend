import { Injectable, HttpException } from '@nestjs/common';
import { Credentials, UserName } from './interfaces/credentials.interface';
import { User } from './interfaces/user.interface';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany();
  }

  async findAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN', erased: false },
    });
  }

  async createAdmin(user: Credentials): Promise<any> {
    const { username, email, password } = user;

    // Verificar si el username ya existe
    const existingUser = await this.prisma.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      throw new HttpException('Username already in use', 409);
    }

    // Verificar si el email ya existe
    const existingEmail = await this.prisma.user.findFirst({
      where: { email },
    });
    if (existingEmail) {
      throw new HttpException('Email already in use', 409);
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

  async changePassword(userData: Credentials): Promise<any> {
    const { username, password } = userData;
    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await this.prisma.user.update({
      where: { username: username },
      data: { password: hashedPassword },
    });
    return {
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
    };
  }

  async updateData(userData: User): Promise<any> {
    const {
      username,
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
    } = userData;
    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const updatedUser = await this.prisma.user.update({
      where: { username: username },
      data: {
        dni,
        name1,
        name2,
        surname1,
        surname2,
        email,
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
      throw new HttpException('User not found', 404);
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
