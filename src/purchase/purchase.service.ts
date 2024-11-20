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
import { UserService } from 'src/users/user.service';
import { EmailService } from 'src/email/email.service';
@Injectable()
export class PurchaseService {
  constructor(
    private prisma: PrismaService,
    private ticketService: TicketService,
    private financialService: FinancialService,
    private userService: UserService,
    private emailService: EmailService,
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
  private async notifyPassengersAfterPurchase(
    tickets: TicketId[],
  ): Promise<any> {
    try {
      for (const ticket of tickets) {
        const ticketData = await this.ticketService.findTicket(
          ticket.flightCode,
          ticket.passengerDni,
        );
        const passenger = await this.ticketService.findPassenger(
          ticket.flightCode,
          ticket.passengerDni,
        );
        await this.emailService.sendEmail(
          passenger.email,
          'Compra de billete',
          `Estimado/a ${passenger.name1} ${passenger.surname1}, le informamos que se ha realizado la compra del billete para el vuelo ${ticket.flightCode}. Su asiento es el ${ticketData.seatNumber}. Gracias por confiar en nosotros.`,
        );
      }
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al notificar a los pasajeros', 500);
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
      await this.notifyPassengersAfterPurchase(tickets);
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
  async findPurchase(id: number): Promise<Purchase> {
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
      const purchase = await this.findPurchase(ticket.purchaseId);
      await this.financialService.refund(purchase.cardNumber, purchase.total);
    }
    return { message: 'Ticket cancelled' };
  }
  private async usersOfPurchases(purchasesId: number[]): Promise<string[]> {
    try {
      const users: string[] = [];
      for (const purchaseId of purchasesId) {
        const purchase = await this.findPurchase(purchaseId);
        if (!users.includes(purchase.username)) {
          users.push(purchase.username);
        }
      }
      return users;
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al buscar los usuarios', 500);
    }
  }
  private async notifyUsers(users: string[], flightCode: string): Promise<any> {
    try {
      for (const username of users) {
        const user = await this.userService.findUser({ username });
        await this.emailService.sendEmail(
          user.email,
          'Vuelo cancelado',
          `Estimado/a ${user.name1} ${user.surname1}, lamentamos informarle que el vuelo ${flightCode} ha sido cancelado. Se le ha reembolsado el importe de la compra. Gracias por confiar en nosotros`,
        );
      }
    } catch (error) {
      console.error(error);
      throw new HttpException('Error al notificar a los usuarios', 500);
    }
  }
  async cancelFlight(flightCode: string): Promise<any> {
    const refoundEachPurchase =
      await this.ticketService.cancelFlight(flightCode);
    if (refoundEachPurchase === false) {
      throw new HttpException('Error al cancelar el vuelo', 500);
    }
    if (refoundEachPurchase.size > 0) {
      const purchasesId: number[] = [];
      for (const purchaseId of refoundEachPurchase.keys()) {
        const purchase = await this.findPurchase(purchaseId);
        await this.financialService.refund(purchase.cardNumber, purchase.total);
        purchasesId.push(Number(purchaseId));
      }
      await this.notifyUsers(
        await this.usersOfPurchases(purchasesId),
        flightCode,
      );
    }
    return { message: 'Flight cancelled' };
  }
}
