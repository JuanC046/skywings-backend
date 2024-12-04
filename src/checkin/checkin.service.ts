import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Checkin, ChangeSeat } from './interfaces/checkin.interface';
import { EmailService } from 'src/email/email.service';
import { BoardingPassService } from 'src/boarding-pass/boarding-pass.service';
import { SeatsService } from 'src/flights/seats.service';
@Injectable()
export class CheckinService {
  constructor(
    private prismaService: PrismaService,
    private emailService: EmailService,
    private boardingPassService: BoardingPassService,
    private seatsService: SeatsService,
  ) {}

  private isTimeToCheckin(flightDeparture: Date): boolean {
    const now = new Date();
    const flightDeparute = new Date(flightDeparture);
    const difference = flightDeparute.getTime() - now.getTime();
    const hours = difference / (1000 * 3600);
    return hours <= 5 && hours >= 1;
  }

  private async isCheckinValid(checkin: Checkin) {
    const ticket = await this.getTicket(
      checkin.flightCode,
      checkin.passengerDni,
    );
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
    const flightDeparture = await this.getFlight(checkin.flightCode);
    if (!this.isTimeToCheckin(flightDeparture.departureDate1)) {
      throw new HttpException(
        'El checkin debe realizarce minimo 1 y máximo 5 horas antes de la salida del vuelo',
        400,
      );
    }
    return true;
  }

  private async sendEmail(checkin: Checkin, boardingPass: Buffer) {
    const passenger = await this.getPassenger(
      checkin.flightCode,
      checkin.passengerDni,
    );
    const flight = await this.getFlight(checkin.flightCode);
    await this.emailService.sendEmail(
      passenger.email,
      'Checkin realizado',
      `Checkin realizado para el vuelo ${flight.code}`,
      undefined,
      boardingPass,
    );
  }

  private async generateBoardingPass(checkin: Checkin) {
    const ticket = await this.updateTicketCheckin(
      checkin.flightCode,
      checkin.passengerDni,
    );
    const passenger = await this.getPassenger(
      checkin.flightCode,
      checkin.passengerDni,
    );
    const flight = await this.getFlight(checkin.flightCode);

    const boardingPass = await this.boardingPassService.generateBoardingPass({
      passengerName: `${passenger.name1} ${passenger.surname1}`,
      flightCode: flight.code,
      origin: flight.origin.split(',')[0],
      departureDate: flight.departureDate1.toISOString().split('T')[0],
      departureTime: flight.departureDate1
        .toISOString()
        .split('T')[1]
        .split('.')[0],
      destination: flight.destination.split(',')[0],
      arrivalDate: flight.arrivalDate1.toISOString().split('T')[0],
      arrivalTime: flight.arrivalDate1
        .toISOString()
        .split('T')[1]
        .split('.')[0],
      seatNumber: ticket.seatNumber,
      suitcases: ticket.numSuitcase.toString(),
    });
    await this.sendEmail(checkin, boardingPass);
  }

  async checkin(checkin: Checkin) {
    await this.isCheckinValid(checkin);
    await this.generateBoardingPass(checkin);
    return 'Checkin realizado';
  }

  private async isChangeSeatValid(changeSeat: ChangeSeat) {
    await this.isCheckinValid({
      flightCode: changeSeat.flightCode,
      passengerDni: changeSeat.passengerDni,
    });
    const ticket = await this.getTicket(
      changeSeat.flightCode,
      changeSeat.passengerDni,
    );
    if (ticket.seatChanged) {
      throw new HttpException('Ya has cambiado de asiento', 400);
    }
    return true;
  }

  private async getTicket(flightCode: string, passengerDni: string) {
    return this.prismaService.ticket.findUnique({
      where: {
        flightCode_passengerDni: {
          flightCode,
          passengerDni,
        },
      },
    });
  }

  private async getFlight(flightCode: string) {
    return this.prismaService.flight.findUnique({
      where: {
        code: flightCode,
      },
    });
  }

  private async getPassenger(flightCode: string, passengerDni: string) {
    return this.prismaService.passenger.findUnique({
      where: {
        dni_flightCode: {
          flightCode,
          dni: passengerDni,
        },
      },
    });
  }

  private async updateTicketCheckin(flightCode: string, passengerDni: string) {
    return this.prismaService.ticket.update({
      where: {
        flightCode_passengerDni: {
          flightCode,
          passengerDni,
        },
      },
      data: {
        checkIn: new Date(),
      },
    });
  }

  private async updateTicketSeatChange(
    flightCode: string,
    passengerDni: string,
    newSeat: number,
  ) {
    console.log('In updating ticket', flightCode, passengerDni, newSeat);
    return this.prismaService.ticket.update({
      where: {
        flightCode_passengerDni: {
          flightCode,
          passengerDni,
        },
      },
      data: {
        seatChanged: true,
        seatNumber: newSeat,
      },
    });
  }
  async changeSeat(changeSeat: ChangeSeat) {
    await this.isChangeSeatValid(changeSeat);
    await this.seatsService.changeSeat(
      changeSeat.flightCode,
      Number(changeSeat.seatNumber),
    );
    await this.updateTicketSeatChange(
      changeSeat.flightCode,
      changeSeat.passengerDni,
      Number(changeSeat.seatNumber),
    );
    return 'Asiento cambiado';
  }
}
