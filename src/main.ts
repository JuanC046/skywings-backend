import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('Server is running on http://localhost:4000');
  await app.listen(4000);
}
bootstrap();
