import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';
import AppConfig from './config/app.config';
import { validationSchema } from './config/validation.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { ItemsModule } from './items/items.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

import { UsersModule } from './users/users.module';
import { TopicsModule } from './topics/topics.module';
import { PromptsModule } from './prompts/prompts.module';
import { AuthModule } from './auth/auth.module';
import { AccessControlModule } from './access-control/access-control.module';
import { GamesModule } from './games/games.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StripeModule } from './stripe/stripe.module';
import { PaymentModule } from './payment/payment.module';

import * as bodyParser from 'body-parser';

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
      playground: false,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({ req, res }) => ({ req, res }),
    }),
    EventEmitterModule.forRoot(),
    CommonModule,
    ItemsModule,
    UsersModule,
    TopicsModule,
    PromptsModule,
    AuthModule,
    AccessControlModule,
    NotificationsModule,
    GamesModule,
    StripeModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: ValidationExceptionFilter,
    // },
  ],
})
export class AppModule implements NestModule {
  constructor(
    @Inject(AppConfig.KEY)
    private readonly appConfig: ConfigType<typeof AppConfig>,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: 'graphql', method: RequestMethod.ALL })
      .forRoutes('*');

    const webhookPath = this.appConfig.stripe.webhookRoute!;

    consumer
      .apply(
        bodyParser.raw({
          type: 'application/json',
        }),
      )
      .forRoutes({ path: webhookPath, method: RequestMethod.POST });

    consumer
      .apply(bodyParser.json(), bodyParser.urlencoded({ extended: true }))
      .exclude({ path: webhookPath, method: RequestMethod.POST })
      .forRoutes('*');
  }
}
