import { Injectable } from "@nestjs/common";
import { Client } from "../interfaces/client.interface";

@Injectable()
export class ClientService {
    private clients: Client[] = [];
    
    create(client: Client): string {
        console.log(client);
        this.clients.push(client);
        return 'Client created';
    }

}