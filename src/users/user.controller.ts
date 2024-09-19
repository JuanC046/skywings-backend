import { Controller, Post, Body } from "@nestjs/common";
import { UserService } from "./services/user.service";
import { User } from "./interfaces/user.interface";
import { ClientService } from "./services/client.service";
import { Client } from "./interfaces/client.interface";
import { AdminService } from "./services/admin.service";
import { Admin } from "./interfaces/admin.interface";
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService, 
        private readonly clientService: ClientService,
        private readonly adminService: AdminService
    ) {}

    @Post('login')
    login(@Body() userData: User): string {
        return this.userService.login(userData);
    }
    @Post('singup')
    singup(@Body() userData: Client): string {
        return this.clientService.create(userData);
    }
    @Post('newadmin')
    newadmin(@Body() userData: Admin): string {
        return this.adminService.create(userData);
    }

}