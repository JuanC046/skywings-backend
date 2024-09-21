import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { Credentials } from './interfaces/credentials.interface';
import { User } from './interfaces/user.interface';
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  login(@Body() credentials: Credentials): string {
    return this.userService.login(credentials);
  }
  @Post('singup')
  singup(@Body() userData: User): string {
    return this.userService.register(userData);
  }
  @Post('newadmin')
  newadmin(@Body() userData: User): string {
    return this.userService.createAdmin(userData);
  }
}
