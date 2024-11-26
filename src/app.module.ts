import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { FlightsModule } from './flights/flights.module';
import { FinancialModule } from './financial/financial.module';
import { TicketModule } from './ticket/ticket.module';
import { PurchaseModule } from './purchase/purchase.module';
import { CheckinModule } from './checkin/checkin.module';

@Module({
  providers: [AppService],
  imports: [
    UserModule,
    AuthModule,
    FlightsModule,
    FinancialModule,
    TicketModule,
    PurchaseModule,
    CheckinModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
