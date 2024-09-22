import { Controller, Post, Body, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { Credentials } from './interfaces/credentials.interface';
import { User } from './interfaces/user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() credentials: Credentials): Promise<any> {
    return this.userService.login(credentials);
  }

  @Post('signup')
  async signup(@Body() userData: User): Promise<any> {
    console.log(userData);
    return this.userService.register(userData);
  }

  @Post('newadmin')
  async newadmin(@Body() userData: Credentials): Promise<any> {
    return this.userService.createAdmin(userData);
  }

  @Put('updatepassword')
  async updatePassword(@Body() userData: Credentials): Promise<any> {
    return this.userService.changePassword(userData);
  }
  
  @Put('updateuser')
  async updateUser(@Body() userData: User): Promise<any> {
    return this.userService.updateData(userData);
  }

  @Post('getuser')
  async getUser(@Body() username: Credentials): Promise<any> {
    return this.userService.findUser(username);
  }
}
