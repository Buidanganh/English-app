import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('English Learning App API')
    .setDescription('API documentation for English learning mobile application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  // Bắt buộc bind vào '0.0.0.0' để cho phép mọi thiết bị mạng (như iPhone) truy cập vào Backend API
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://localhost:${port} and http://0.0.0.0:${port}`);
  console.log(`📚 Swagger Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
