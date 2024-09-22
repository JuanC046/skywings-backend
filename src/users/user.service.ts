import { Injectable, HttpException, Body } from '@nestjs/common';
import { Credentials } from './interfaces/credentials.interface';
import { User } from './interfaces/user.interface';
import { PrismaService } from '../prisma.service';
// import { User as UserModel, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import e from 'express';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async login(credentials: Credentials): Promise<any> {
    const { username, password } = credentials;

    // 1. Buscar el usuario por username
    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });

    // 2. Verificar que el usuario exista
    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }

    // 3. Verificar que el usuario no esté marcado como "erased"
    if (user.erased) {
      throw new HttpException('This user is no longer active', 401);
    }

    // 4. Verificar la contraseña
    // Validar si la contraseña está encriptada
    let hashedPassword = user.password;
    if (!user.password.startsWith('$2b$')) {
      hashedPassword = await bcrypt.hash(user.password, 10);
    }
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', 401);
    }

    // Si todo es correcto, devolver el usuario por ahora
    return {
      username: user.username,
      email: user.email,
      role: user.role,
      user_image: user.image,
    };
  }
  
  async createAdmin(user: Credentials): Promise<any> {
    const { username, password } = user;

    // Verificar si el username ya existe
    const existingUser = await this.prisma.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      throw new HttpException('Username already in use', 409);
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    return {
      username: newUser.username,
      role: newUser.role,
    };
  }
  async register(userData: User): Promise<any> {
    const {
      username,
      password,
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

    // Verificar si el username o email ya existen
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }, { dni }],
      },
    });

    if (existingUser) {
      throw new HttpException('Username, email, or dni already in use', 409);
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
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
        // El rol se deja como valor por defecto ("USER"), y no es necesario pasarlo explícitamente.
      },
    });

    return {
      username: newUser.username,
      email: newUser.email,
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

  async findUser(userData: Credentials): Promise<User> {
    const { username } = userData;
    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const response: User = {
      username: user.username,
      password: user.password, 
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

}
