import { Module } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { FlightsController } from './flights.controller';
import { PrismaService } from '../prisma.service';
import { ValidationService } from '../validation/validation.service';
import { UtilitiesService } from './utilities.service';
import { NewsService } from './news.service';

@Module({
  providers: [
    FlightsService,
    PrismaService,
    ValidationService,
    UtilitiesService,
    NewsService,
  ],
  controllers: [FlightsController],
})
export class FlightsModule {}
