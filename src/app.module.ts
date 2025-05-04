import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';
import { validationSchema } from './config/validation.schema';
import AppConfig from './config/app.config';
import { TypeOrmModule } from '@nestjs/typeorm';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
