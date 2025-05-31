import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswersService } from './responses.service';
import { AnswersController } from './responses.controller';
import { PlayerResponse } from './entities/response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerResponse])],
  providers: [AnswersService],
  controllers: [AnswersController]
})
export class AnswersModule {}
