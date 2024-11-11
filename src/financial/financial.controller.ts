import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Card } from './interfaces/card';
import { FinancialService } from './financial.service';

@ApiTags('financial')
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('create')
  async addCard(@Body() cardData: Card): Promise<Card> {
    return this.financialService.addCard(cardData);
  }
}
