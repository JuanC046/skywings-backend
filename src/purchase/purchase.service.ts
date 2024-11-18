import {
  Purchase,
  PurchasesData,
  TicketId,
  PurchaseResponse,
} from './interfaces/purchase.interface';
import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TicketService } from 'src/ticket/ticket.service';
import { FinancialService } from 'src/financial/financial.service';
@Injectable()
export class PurchaseService {
  constructor(
    private prisma: PrismaService,
    private ticketService: TicketService,
    private financialService: FinancialService,
  ) {}
  private async totalPrice(tickets: TicketId[]): Promise<number> {
    try {
      let total = 0;
      for (const ticket of tickets) {
        const ticketData = await this.ticketService.findTicket(
          ticket.flightCode,
          ticket.passengerDni,
        );
        total += ticketData.price;
      }
      return total;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error calculating total price', 500);
    }
  }
  private async setPurchaseId(purchaseId: number, tickets: TicketId[]) {
    try {
      for (const ticket of tickets) {
        await this.ticketService.setTicketPurchaseId(
          ticket.flightCode,
          ticket.passengerDni,
          purchaseId,
        );
      }
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al asignar el id de la compra', 500);
    }
  }
  private async createPurchaseInDataBase(
    purchase: Purchase,
  ): Promise<Purchase> {
    try {
      return await this.prisma.purchases.create({
        data: purchase,
      });
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al registrar la compra', 500);
    }
  }
  async createPurchase(purchaseData: PurchasesData): Promise<PurchaseResponse> {
    const { username, cardNumber, cvv, tickets } = purchaseData;
    try {
      const total = await this.totalPrice(tickets);
      await this.financialService.payment(cardNumber, cvv, total);
      const purchase: Purchase = {
        username,
        cardNumber,
        total,
        creationDate: new Date(),
      };
      const createdPurchase: Purchase =
        await this.createPurchaseInDataBase(purchase);
      await this.setPurchaseId(createdPurchase.id, tickets);
      const purchaseResponse: PurchaseResponse = {
        purchase: createdPurchase,
        totalTickets: tickets.length,
      };
      return purchaseResponse;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al procesar la compra', 500);
    }
  }
  async finfPurchase(id: number): Promise<Purchase> {
    try {
      return await this.prisma.purchases.findUnique({
        where: {
          id,
        },
      });
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al buscar la compra', 500);
    }
  }
  async userPurchases(username: string): Promise<Purchase[]> {
    try {
      return await this.prisma.purchases.findMany({
        where: {
          username,
        },
      });
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al buscar las compras', 500);
    }
  }
  async cancelTicket(ticketId: TicketId): Promise<any> {
    const { flightCode, passengerDni } = ticketId;
    const ticket = await this.ticketService.findTicket(
      flightCode,
      passengerDni,
    );
    await this.ticketService.cancelTicket(ticket);
    if (ticket.purchaseId !== 0) {
      const purchase = await this.finfPurchase(ticket.purchaseId);
      await this.financialService.refund(purchase.cardNumber, purchase.total);
    }
    return { message: 'Ticket cancelled' };
  }
}
