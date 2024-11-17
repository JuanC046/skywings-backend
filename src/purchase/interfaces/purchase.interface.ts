export interface Purchase {
  id?: number;
  username: string;
  cardNumber: string;
  total: number;
  creationDate: Date;
  status?: string;
}
export interface TicketId {
  flightCode: string;
  passengerDni: string;
}
export interface PurchasesData {
  username: string;
  cardNumber: string;
  cvv: string;
  tickets: TicketId[];
}
export interface PurchaseResponse {
  purchase: Purchase;
  totalTickets: number;
}
