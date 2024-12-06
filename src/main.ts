import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req, res, next) => {
    console.log(`Request... ${req.method} ${req.url}`);
    next();
  });
  // console.log('Server is running on http://localhost:4000');
  const config = new DocumentBuilder()
    .setTitle('Skywings API')
    .setDescription('The Skywings API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors();
  const port = process.env.PORT || 4000;
  await app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
}
bootstrap();
