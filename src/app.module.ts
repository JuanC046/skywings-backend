import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { FlightsModule } from './flights/flights.module';
import { FinancialModule } from './financial/financial.module';

@Module({
  providers: [AppService],
  imports: [UserModule, AuthModule, FlightsModule, FinancialModule],
  controllers: [AppController],
})
export class AppModule {}
