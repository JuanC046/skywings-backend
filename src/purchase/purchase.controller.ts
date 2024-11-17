import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import {
  PurchasesData,
  PurchaseResponse,
} from './interfaces/purchase.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('purchase')
@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post('create')
  async create(@Body() purchaseData: PurchasesData): Promise<PurchaseResponse> {
    return this.purchaseService.createPurchase(purchaseData);
  }
}
