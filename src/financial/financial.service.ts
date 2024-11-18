import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HttpException } from '@nestjs/common';
import { Card } from './interfaces/card.interface';
@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  private isNumber(number: any, label: string, longitud: number): void {
    number = number.toString();
    if (isNaN(number)) {
      throw new HttpException(`El número de ${label} debe ser numérico`, 400);
    }
    if (number.length !== longitud) {
      throw new HttpException(
        `El número de ${label} debe tener ${longitud} dígitos`,
        400,
      );
    }
  }
  private isCurrentDate(date: Date): void {
    const currentDate = new Date();
    if (date < currentDate) {
      throw new HttpException(
        'La fecha de expiración debe ser mayor a la fecha actual',
        400,
      );
    }
  }
  private isPositiveNumber(number: number, label: string): void {
    if (number < 0) {
      throw new HttpException(`El ${label} debe ser un número positivo`, 400);
    }
  }
  private validateType(type: string): void {
    if (type !== 'debit' && type !== 'credit') {
      throw new HttpException(
        'El tipo de tarjeta debe ser debit o credit',
        400,
      );
    }
  }

  private validateCardData(cardData: Card): void {
    const { number, expirationDate, cvv, balance, type } = cardData;
    this.isPositiveNumber(Number(number), 'tarjeta');
    this.isPositiveNumber(Number(cvv), 'CVV');
    this.isNumber(number, 'tarjeta', 16);
    this.isNumber(cvv, 'CVV', 3);
    this.isPositiveNumber(balance, 'balance');
    this.isCurrentDate(expirationDate);
    this.validateType(type);
  }
  private async cardExists(number: string): Promise<boolean> {
    const card = await this.prisma.cards.findFirst({
      where: {
        number: number,
        erased: false,
      },
    });
    return card ? true : false;
  }
  private async cardDeleted(number: string): Promise<boolean> {
    const card = await this.prisma.cards.findFirst({
      where: {
        number: number,
        erased: true,
      },
    });
    return card ? true : false;
  }
  private async activateCard(
    number: string,
    expirationDate: Date,
    balance: number,
    type: string,
  ): Promise<Card> {
    const card = await this.prisma.cards.update({
      where: {
        number: number,
      },
      data: {
        erased: false,
        expirationDate: expirationDate,
        balance: balance,
        type: type,
      },
    });
    return card;
  }

  async addCard(cardData: Card): Promise<Card> {
    this.validateCardData(cardData);
    const { number, propietary, expirationDate, cvv, balance, type } = cardData;
    const cardExists = await this.cardExists(number);
    if (cardExists) {
      throw new HttpException('No es posible registrar esta tarjeta', 400);
    }
    const cardDeleted = await this.cardDeleted(number);
    if (cardDeleted) {
      const card = await this.activateCard(
        number,
        expirationDate,
        balance,
        type,
      );
      return card;
    }
    try {
      const card = await this.prisma.cards.create({
        data: {
          number,
          propietary,
          expirationDate,
          cvv,
          balance,
          type,
        },
      });
      return card;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error en la creación de la tarjeta', 400);
    }
  }
  async updteCardBalance(data: any): Promise<Card> {
    const { number, balance } = data;
    this.isPositiveNumber(Number(number), 'tarjeta');
    this.isPositiveNumber(balance, 'balance');
    const cardExists = await this.cardExists(number);
    if (!cardExists) {
      throw new HttpException('La tarjeta no ha sido registrada', 400);
    }
    const cardDeleted = await this.cardDeleted(number);
    if (cardDeleted) {
      throw new HttpException('La tarjeta ha sido eliminada', 400);
    }
    try {
      const card = await this.prisma.cards.update({
        where: {
          number,
        },
        data: {
          balance,
        },
      });
      return card;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error en la actualización de la tarjeta', 400);
    }
  }
  async findCard(number: string): Promise<Card> {
    this.isPositiveNumber(Number(number), 'tarjeta');
    const cardExists = await this.cardExists(number);
    if (!cardExists) {
      throw new HttpException('La tarjeta no ha sido registrada', 400);
    }
    const cardDeleted = await this.cardDeleted(number);
    if (cardDeleted) {
      throw new HttpException('La tarjeta ha sido eliminada', 400);
    }
    try {
      const card = await this.prisma.cards.findFirst({
        where: {
          number,
        },
      });
      return card;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error en la búsqueda de la tarjeta', 400);
    }
  }
  async findCards(propietary: string): Promise<Card[]> {
    try {
      const cards = await this.prisma.cards.findMany({
        where: {
          propietary,
          erased: false,
        },
      });
      return cards;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error en la búsqueda de las tarjetas', 400);
    }
  }
  async deleteCard(number: string): Promise<boolean> {
    this.isPositiveNumber(Number(number), 'tarjeta');
    const cardExists = await this.cardExists(number);
    if (!cardExists) {
      throw new HttpException('La tarjeta no ha sido registrada', 400);
    }
    const cardDeleted = await this.cardDeleted(number);
    if (cardDeleted) {
      throw new HttpException('La tarjeta ya ha sido eliminada', 400);
    }
    try {
      await this.prisma.cards.update({
        where: {
          number,
        },
        data: {
          erased: true,
        },
      });
      return true;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error en la eliminación de la tarjeta', 400);
    }
  }
  async payment(cardNumber: string, cvv: string, total: number): Promise<void> {
    const card: Card = await this.findCard(cardNumber);
    this.isPositiveNumber(total, 'total');
    if (card.cvv !== cvv) {
      throw new HttpException('El cvv no coincide', 400);
    }
    if (card.balance < total) {
      throw new HttpException('Saldo insuficiente', 400);
    }
    const newBalance = card.balance - total;
    await this.prisma.cards.update({
      where: {
        number: cardNumber,
      },
      data: {
        balance: newBalance,
      },
    });
  }
  async refund(cardNumber: string, total: number): Promise<void> {
    const card: Card = await this.findCard(cardNumber);
    this.isPositiveNumber(total, 'total');
    const newBalance = card.balance + total;
    await this.prisma.cards.update({
      where: {
        number: cardNumber,
      },
      data: {
        balance: newBalance,
      },
    });
  }
}
