import { Controller, Body, Patch } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { Checkin } from './interfaces/checkin.interface';
import { ChangeSeat } from './interfaces/checkin.interface';
import { ApiTags } from '@nestjs/swagger';

@Controller('checkin')
@ApiTags('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Patch()
  async checkin(@Body() checkin: Checkin) {
    return this.checkinService.checkin(checkin);
  }

  @Patch('change-seat')
  async changeSeat(@Body() changeSeat: ChangeSeat) {
    return this.checkinService.changeSeat(changeSeat);
  }
}
