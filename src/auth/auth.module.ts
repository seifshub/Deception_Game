// auth.module.ts
import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import AppConfig from '../config/app.config';
import { ConfigType } from '@nestjs/config';
import appConfig from '../config/app.config';
import { UserSerializer } from './serializers/user-serializer';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './guards/authentication.guard';
import { SessionGuard } from './guards/session.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { cookieParserMiddleware, createSessionMiddleware, passportMiddlewares } from 'src/common/middlewares/session.middleware';


@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    SessionGuard,
    AuthService,
    UserSerializer,
  ],
  controllers: [AuthController],
})
export class AuthModule implements NestModule {
  constructor(
    @Inject(AppConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const sessionMiddleware = createSessionMiddleware(
      this.appConfiguration.session.secret!,
    );

    consumer
      .apply(
        cookieParserMiddleware,
        sessionMiddleware,
        ...passportMiddlewares,
        (req, res, next) => {
          next();
        },
      )
      .forRoutes('*');
  }
}
