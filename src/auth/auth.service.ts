import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Credentials } from '../users/interfaces/credentials.interface';
// import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
      }),
    };
  }
}
