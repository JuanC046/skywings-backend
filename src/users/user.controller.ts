import { Controller, Get, Post, Body, Put, Patch, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { Credentials } from './interfaces/credentials.interface';
import { User } from './interfaces/user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAllUsers(): Promise<any> {
    return this.userService.findAllUsers();
  }

  // @Post('login')
  // async login(@Body() credentials: Credentials): Promise<any> {
  //   return this.userService.login(credentials);
  // }

  @Post('signup')
  async signup(@Body() userData: User): Promise<any> {
    console.log(userData);
    return this.userService.register(userData);
  }

  @Post('newadmin')
  async newadmin(@Body() userData: Credentials): Promise<any> {
    return this.userService.createAdmin(userData);
  }

  //Se utiliza Patch en lugar de Put debido a que es una actualización parcial, un solo campo
  @Patch('updatepassword')
  async updatePassword(@Body() userData: Credentials): Promise<any> {
    return this.userService.changePassword(userData);
  }

  @Put('updateuser')
  async updateUser(@Body() userData: User): Promise<any> {
    return this.userService.updateData(userData);
  }

  @Get('getuser')
  async getUser(@Body() username: string): Promise<any> {
    return this.userService.findUser(username);
  }

  @Delete('deleteadmin')
  async deleteAdmin(@Body() username: string): Promise<any> {
    return this.userService.delete(username);
  }
}
