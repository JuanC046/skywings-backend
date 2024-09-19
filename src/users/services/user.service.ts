import { Injectable } from '@nestjs/common';
import { User } from '../interfaces/user.interface';

@Injectable()
export class UserService {
    login(userData: User): string {
        console.log(userData);
        return 'User login';
    }
    // logout(): string {
    //     return 'User logout';
    // }
    changePassword(): string {
        return 'User change password';
    }
}