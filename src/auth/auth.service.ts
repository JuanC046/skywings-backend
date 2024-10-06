import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Credentials } from '../users/interfaces/credentials.interface';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { User } from 'src/users/interfaces/user.interface';
import { ValidationService } from 'src/validation/validation.service';
import { log } from 'console';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private validationUser: ValidationService,
  ) {}

  async login(credentials: Credentials): Promise<any> {
    const { username, password } = credentials;

    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar que el usuario no esté marcado como "erased"
    if (user.erased) {
      throw new UnauthorizedException('This user is no longer active');
    }

    let hashedPassword = user.password;
    if (!user.password.startsWith('$2b$')) {
      hashedPassword = await hash(user.password, 10);
    }

    const isPasswordValid = await compare(password, hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      username: user.username,
      email: user.email,
      // role: await hash(user.role, 10),
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '10m',
      }),
      role: user.role,
    };
  }

  async register(userData: User): Promise<any> {
    await this.validationUser.validateUserData(userData);
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
      throw new HttpException(
        'El nombre de usuario, correo o dni ya se encuentra en uso',
        409,
      );
    }

    // Encriptar la contraseña
    const hashedPassword = await hash(password, 10);

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
        birthDate: birthDate ? new Date(birthDate) : null,
        image: user_image,
        // El rol se deja como valor por defecto ("USER"), y no es necesario pasarlo explícitamente.
      },
    });

    return {
      message: 'User created succesfully',
      username: newUser.username,
    };
  }
}
