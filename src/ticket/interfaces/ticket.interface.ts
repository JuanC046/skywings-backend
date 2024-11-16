import { PassengersData } from './passenger.interface';
export interface Ticket {
  flightCode: string;
  passengerDni: string;
  username: string;
  purchaseId: number;
  seatNumber: number;
  price: number;
  creationDate: Date;
  checkIn?: Date;
  numSuitcase: number;
  erased?: boolean;
}

export interface TicketsData {
  username: string;
  purchaseId: number; // 0: Booking, otherwise: Purchase
  listTickets: PassengersData[];
}
