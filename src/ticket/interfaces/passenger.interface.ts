export interface Passenger {
  dni: string;
  flightCode?: string;
  name1: string;
  name2?: string;
  surname1: string;
  surname2?: string;
  birthdate: Date;
  gender: string;
  phone: string;
  email: string;
  contactName: string;
  contactPhone: string;
  erased: boolean;
}
export interface PassengersData {
  flightCode: string;
  seatClass: string;
  passengers: Passenger[];
}
