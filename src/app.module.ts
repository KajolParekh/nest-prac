import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsModule } from './items/items.module';
import { LoggerMiddleware } from './middleware/logger/logger.middleware';
import { ApitokenauthMiddleware } from './middleware/apitokenauth/apitokenauth.middleware';

@Module({
  imports: [ItemsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
      consumer
      .apply(LoggerMiddleware, ApitokenauthMiddleware)
      .forRoutes('*') // Applies to all routes
  }
}
