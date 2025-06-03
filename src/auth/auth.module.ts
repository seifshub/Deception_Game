import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import * as session from 'express-session';
import * as passport from 'passport';
import AppConfig from '../config/app.config';
import { ConfigType } from '@nestjs/config';
import appConfig from '../config/app.config';
import { UserSerializer } from './serializers/user-serializer';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './guards/authentication.guard';
import { SessionGuard } from './guards/session.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

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
    consumer
      .apply(
        session({
          secret: this.appConfiguration.session.secret!,
          resave: false,
          saveUninitialized: false,
          cookie: {
            sameSite: 'none', // Changed from 'lax' to 'none' for cross-origin
            secure: false,    // In production this should be true, but for local development false
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
          },
        }),
        passport.initialize(),
        passport.session(),
      )
      .forRoutes('*');
  }
}
