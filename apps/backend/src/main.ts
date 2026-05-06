import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { isAllowedLocalOrigin } from './common/local-origin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin(origin, callback) {
        const allowed = isAllowedLocalOrigin(origin);
        callback(allowed ? null : new Error('Origin not allowed'), allowed);
      },
    },
  });
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000, '127.0.0.1');
}

bootstrap();
