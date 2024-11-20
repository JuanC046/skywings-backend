import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards, // Se implementará luego
} from '@nestjs/common';
import { FlightsService } from './flights.service';
import { OriginDestination } from './interfaces/flight.interface';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/decorator/roles.enum';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/auth.roles.guard';
@ApiTags('flights')
@Controller('flights')
export class FlightsController {
  constructor(private flightsService: FlightsService) {}

  @Get()
  async findActualFlights(): Promise<any> {
    return this.flightsService.findActualFlights();
  }
  @Get('news')
  async findAllNews(): Promise<any> {
    console.log('Ingresó a findAllNews');
    return this.flightsService.findAllNews();
  }
  @Get('flight/:flightCode')
  async findFlightByCode(
    @Param('flightCode') flightCode: string,
  ): Promise<any> {
    return this.flightsService.findFlightByCode(flightCode);
  }
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(Role.Admin)
  @Get('realized')
  async findRealizedFlights(): Promise<any> {
    return this.flightsService.findFlightsRealized();
  }
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(Role.Admin)
  @Post('create')
  async newFlight(@Body() flightData: any): Promise<any> {
    return this.flightsService.createFlight(flightData);
  }
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(Role.Admin)
  @Patch('update')
  async updateFlight(@Body() flightData: any): Promise<any> {
    return this.flightsService.changeFlightPrice(flightData);
  }
  @Get('route')
  async findFlightsByRoute(@Body() route: OriginDestination): Promise<any> {
    return this.flightsService.findFlightsByRoute(route);
  }

  @Get('seats/:flightCode')
  async findSeatsByFlight(
    @Param('flightCode') flightCode: string,
  ): Promise<any> {
    return this.flightsService.findSeatsByFlight(flightCode);
  }
}
