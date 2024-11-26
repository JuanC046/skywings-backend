import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Checkin } from './interfaces/checkin.interface';
import { EmailService } from 'src/email/email.service';
import { BoardingPassService } from 'src/boarding-pass/boarding-pass.service';
@Injectable()
export class CheckinService {
  constructor(
    private prismaService: PrismaService,
    private emailService: EmailService,
    private boardingPassService: BoardingPassService,
  ) {}
  private isTimeToCheckin(flightDeparture: Date): boolean {
    const now = new Date();
    const flightDeparute = new Date(flightDeparture);
    const difference = flightDeparute.getTime() - now.getTime();
    const hours = difference / (1000 * 3600);
    if (hours >= 1) {
      return true;
    }
    return false;
  }

  private async isCheckinValid(checkin: Checkin) {
    const ticket = await this.prismaService.ticket.findUnique({
      where: {
        flightCode_passengerDni: {
          flightCode: checkin.flightCode,
          passengerDni: checkin.passengerDni,
        },
      },
    });
    if (!ticket) {
      throw new HttpException('No existe el ticket', 400);
    }
    if (ticket.checkIn) {
      throw new HttpException('Ya has hecho el checkin', 400);
    }
    if (ticket.purchaseId === 0) {
      throw new HttpException(
        'No puedes hacer checkin sin haber comprado el ticket',
        400,
      );
    }
    const flightDeparture = await this.prismaService.flight.findUnique({
      where: {
        code: checkin.flightCode,
      },
      select: {
        departureDate1: true,
      },
    });
    if (!this.isTimeToCheckin(flightDeparture.departureDate1)) {
      throw new HttpException('Has pasado el tiempo de checkin', 400);
    }
    return true;
  }
  private async sendEmail(checkin: Checkin, boardingPass: Buffer) {
    const passenger = await this.prismaService.passenger.findUnique({
      where: {
        dni_flightCode: {
          flightCode: checkin.flightCode,
          dni: checkin.passengerDni,
        },
      },
    });
    const flight = await this.prismaService.flight.findUnique({
      where: {
        code: checkin.flightCode,
      },
    });
    await this.emailService.sendEmail(
      passenger.email,
      'Checkin realizado',
      `Checkin realizado para el vuelo ${flight.code}`,
      undefined,
      boardingPass,
    );
  }
  async checkin(checkin: Checkin) {
    await this.isCheckinValid(checkin);
    await this.prismaService.ticket.update({
      where: {
        flightCode_passengerDni: {
          flightCode: checkin.flightCode,
          passengerDni: checkin.passengerDni,
        },
      },
      data: {
        checkIn: new Date(),
      },
    });
    const boardingPass = await this.boardingPassService.generateBoardingPass({
      name: checkin.passengerDni,
      flight: checkin.flightCode,
      seat: '1A',
    });
    await this.sendEmail(checkin, boardingPass);
    return 'Checkin realizado';
  }
}
