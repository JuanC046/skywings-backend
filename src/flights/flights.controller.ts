import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards, // Se implementará luego
} from '@nestjs/common';
import { FlightsService } from './flights.service';
import { OriginDestination, FlightCode } from './interfaces/flight.interface';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Get()
  async findActualFlights(): Promise<any> {
    return this.flightsService.findActualFlights();
  }
  @Get('realized')
  async findRealizedFlights(): Promise<any> {
    return this.flightsService.findFlightsRealized();
  }
  @Get('news')
  async findAllNews(): Promise<any> {
    return this.flightsService.findAllNews();
  }
  @Post('create')
  async newFlight(@Body() flightData: any): Promise<any> {
    return this.flightsService.createFlight(flightData);
  }
  @Delete('delete')
  async deleteFlight(@Body() parameters: any): Promise<any> {
    return this.flightsService.deleteFlight(parameters.flightCode);
  }
  @Patch('update')
  async updateFlight(@Body() flightData: any): Promise<any> {
    return this.flightsService.changeFlightPrice(
      flightData.flightCode,
      flightData.priceEconomyClass,
      flightData.priceFirstClass,
      flightData.updater,
    );
  }
  @Get('route')
  async findFlightsByRoute(@Body() route: OriginDestination): Promise<any> {
    return this.flightsService.findFlightsByRoute(route);
  }
  @Get('seats')
  async findSeatsByFlight(@Body() flightCode: FlightCode): Promise<any> {
    return this.flightsService.findSeatsByFlight(flightCode);
  }

}
