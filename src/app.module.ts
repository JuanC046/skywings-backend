import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { FlightsModule } from './flights/flights.module';

@Module({
  providers: [AppService],
  imports: [UserModule, AuthModule, FlightsModule],
  controllers: [AppController],
})
export class AppModule {}
