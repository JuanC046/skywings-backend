export interface Flight {
  code?: string;
  creator: string; // username admin
  type: string; // National or International
  origin: string;
  destination: string;
  priceFirstClass: number;
  priceEconomyClass: number;
  departureDate1: Date;
  arrivalDate1?: Date;
  departureDate2: Date;
  arrivalDate2?: Date;
  creationDate: Date;
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
