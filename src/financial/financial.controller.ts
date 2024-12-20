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
import { Card } from './interfaces/card.interface';
import { FinancialService } from './financial.service';
import { Role } from '../auth/decorator/roles.enum';
import { Roles } from '../auth/decorator/roles.decorator';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/auth.roles.guard';
@ApiTags('financial')
@Controller('financial')
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('create')
  async addCard(@Body() cardData: Card): Promise<Card> {
    return this.financialService.addCard(cardData);
  }
  @Patch('update')
  async updateCard(@Body() cardData: any): Promise<Card> {
    return this.financialService.updteCardBalance(cardData);
  }
  @Get('/:number')
  async getCard(@Param('number') number: string): Promise<Card> {
    return this.financialService.findCard(number);
  }
  @Get('user/:propietary')
  async getCardsByUser(
    @Param('propietary') propietary: string,
  ): Promise<Card[]> {
    return this.financialService.findCards(propietary);
  }
  @Delete('delete')
  async deleteCard(@Body() cardData: any): Promise<boolean> {
    return this.financialService.deleteCard(cardData.number);
  }
}
