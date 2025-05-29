import { Module, MiddlewareConsumer, NestModule  } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';
import { validationSchema } from './config/validation.schema';
import AppConfig from './config/app.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ItemsModule } from './items/items.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

import { UsersModule } from './users/users.module';
import { TopicsModule } from './topics/topics.module';
import { PromptsModule } from './prompts/prompts.module';
import { AuthModule } from './auth/auth.module';
import { AccessControlModule } from './access-control/access-control.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(appConfig)],
      useFactory: (config: ConfigType<typeof AppConfig>) => ({
        type: 'postgres',
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.name,
        autoLoadEntities: true,
        synchronize: config.database.synchronize,
      }),
      inject: [AppConfig.KEY],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      buildSchemaOptions: {
        numberScalarMode: 'integer',
      },
      context: ({ req, res }) => ({ req, res }),
    }),
    CommonModule,
    ItemsModule,
    UsersModule,
    TopicsModule,
    PromptsModule,
    AuthModule,
    AccessControlModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule { 
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
