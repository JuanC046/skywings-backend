import { PassengersData } from './passenger.interface';
export interface Ticket {
  flightCode: string;
  passengerDni: string;
  username: string;
  purchaseId?: number;
  seatNumber: number;
  seatChanged?: boolean;
  price: number;
  creationDate: Date;
  checkIn?: Date;
  numSuitcase: number;
  erased?: boolean;
}

export interface TicketsData {
  username: string;
  listTickets: PassengersData[];
}
