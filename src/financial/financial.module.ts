import { Module } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { PrismaService } from '../prisma.service';


@Module({
  providers: [FinancialService, PrismaService],
  controllers: [FinancialController],
})
export class FinancialModule {}