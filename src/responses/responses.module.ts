import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerResponseService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { PlayerResponse } from './entities/response.entity';
import { PlayerResponseValidator } from './validators/response.validator';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerResponse])],
  providers: [PlayerResponseService, PlayerResponseValidator],
  controllers: [ResponsesController],
  exports: [PlayerResponseService, PlayerResponseValidator],
})
export class ResponsesModule {}
