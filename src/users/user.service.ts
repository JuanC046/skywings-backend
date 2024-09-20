import { Injectable } from '@nestjs/common';
import { Credentials } from './interfaces/credentials.interface';
import { User } from './interfaces/user.interface';
@Injectable()
export class UserService {
  login(credentials: Credentials): string {
    console.log(credentials);
    return 'User login';
  }
  createAdmin(user: User): string {
    console.log(user);
    return 'Admin created';
  }
  register(user: User): string {
    console.log(user);
    return 'User registered';
  }
  // logout(): string {
  //     return 'User logout';
  // }
  changePassword(): string {
    return 'User change password';
  }
}
