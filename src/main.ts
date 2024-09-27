import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Skywings API')
    .setDescription('The Skywings API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const port = process.env.PORT || 4000;
  const ip = process.env.IP || 'localhost';
  console.log(`Server is running on http://${ip}:${port}/api`);
  await app.listen(port, ip);
}
bootstrap();
