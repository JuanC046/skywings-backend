export interface Card {
  number: string;
  propietary: string;
  expirationDate: Date;
  cvv: string;
  balance: number;
  type: string;
  erased?: boolean;
}
