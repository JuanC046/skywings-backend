import { Module } from "@nestjs/common";
import { UserService } from "./services/user.service";
import { UserController } from "./user.controller";
import { ClientService } from "./services/client.service";
import { AdminService } from "./services/admin.service";

@Module({
    providers: [UserService, ClientService, AdminService],
    controllers: [UserController]
})
export class UserModule {}