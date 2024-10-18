import { Module } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { FlightsController } from './flights.controller';
import { PrismaService } from '../prisma.service';
import { ValidationService } from '../validation/validation.service';

@Module({
  providers: [FlightsService, PrismaService, ValidationService],
  controllers: [FlightsController],
})
export class FlightsModule {}