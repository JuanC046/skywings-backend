import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import {
  PurchasesData,
  PurchaseResponse,
  TicketId,
} from './interfaces/purchase.interface';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/auth.roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/decorator/roles.enum';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.User)
@ApiTags('purchase')
@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post('create')
  async create(@Body() purchaseData: PurchasesData): Promise<PurchaseResponse> {
    return this.purchaseService.createPurchase(purchaseData);
  }
  @Get('all/:username')
  async findAll(@Param('username') username: string): Promise<any> {
    return this.purchaseService.userPurchases(username);
  }
}
@Controller('tickets')
export class CancelTicketController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Delete('cancel')
  async cancelTicket(@Body() ticketId: TicketId): Promise<any> {
    return this.purchaseService.cancelTicket(ticketId);
  }
}
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('flights')
export class CancelFlightController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Delete('delete')
  async deleteFlight(@Body() parameters: any): Promise<any> {
    return this.purchaseService.cancelFlight(parameters.flightCode);
  }
}
