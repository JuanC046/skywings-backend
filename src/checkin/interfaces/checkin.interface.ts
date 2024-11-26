export interface Checkin {
  flightCode: string;
  passengerDni: string;
}

export interface ChangeSeat {
  flightCode: string;
  passengerDni: string;
  seat: string;
}