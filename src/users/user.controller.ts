import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  Credentials,
  PasswordChange,
  UserName,
} from './interfaces/credentials.interface';
import { User } from './interfaces/user.interface';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/auth.roles.guard';

@ApiTags('Users Module')
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('admins')
  async findAdmins(): Promise<any> {
    return this.userService.findAdmins();
  }

  @Post('newadmin')
  async newadmin(@Body() userData: Credentials): Promise<any> {
    return this.userService.createAdmin(userData);
  }

  @Patch('updatepassword')
  async updatePassword(@Body() userData: PasswordChange): Promise<any> {
    return this.userService.changePassword(userData);
  }

  @Put('updateuser')
  async updateUser(@Body() userData: User): Promise<any> {
    return this.userService.updateData(userData);
  }

  @Post('getuser')
  async getUser(@Body() username: UserName): Promise<any> {
    return this.userService.findUser(username);
  }

  @Delete('deleteadmin')
  async deleteAdmin(@Body() username: UserName): Promise<any> {
    return this.userService.delete(username);
  }
}
@ApiTags('Get Users Data')
@Controller('users')
export class UsersDataController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAllUsers(): Promise<any> {
    return this.userService.findAllUsers();
  }
}