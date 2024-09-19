import { Controller, Post, Body } from "@nestjs/common";
import { UserService } from "./services/user.service";
// import { AdminService } from "./services/admin.service";
// import { Admin } from "./interfaces/admin.interface";
// import { ClientService } from "./services/client.service";
// import { Client } from "./interfaces/client.interface";
import { User } from "./interfaces/user.interface";
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('login')
    login(@Body() userData: User): string {
        return this.userService.login(userData);
    }
}