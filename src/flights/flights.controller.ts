import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FlightsService } from './flights.service';

@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Get()
  async findAllFlights(): Promise<any> {
    return this.flightsService.findAllFlights();
  }

  @Post('newflight')
  async newFlight(@Body() flightData: any): Promise<any> {
    return this.flightsService.createFlight(flightData);
  }
}