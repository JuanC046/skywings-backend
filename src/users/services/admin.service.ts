import { Injectable } from "@nestjs/common";
// import { UserService } from "./user.service";
import { Admin } from "../interfaces/admin.interface";

@Injectable()
export class AdminService {
    private admins: Admin[] = [];
    // constructor(private userService: UserService) {}
    
    create(admin: Admin): string {
        console.log(admin);  
        this.admins.push(admin);
        return 'Admin created';
    }
    delete(): string {
        return 'Admin deleted';
    }
}