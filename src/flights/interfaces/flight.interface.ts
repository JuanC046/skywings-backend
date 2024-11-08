export interface Flight {
  code?: string;
  creator: string; // username admin
  type: string; // National or International
  origin: string;
  destination: string;
  priceFirstClass: number;
  priceEconomyClass: number;
  flightTime?: string;
  departureDate1: Date;
  arrivalDate1?: Date;
  creationDate?: Date;
  lastUpdateDate?: Date;
}

export interface Seats {
  flightCode: string;
  totalSeats: number;
  totalFirst: number;
  totalTourist: number;
  avaliableFirst: string;
  avaliableTourist: string;
  busyFirst: string;
  busyTourist: string;
  erased: boolean;
}

export interface OriginDestination {
  origin: string;
  destination: string;
}

export interface FlightCode {
  flightCode: string;
}