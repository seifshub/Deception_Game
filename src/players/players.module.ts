import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { PlayersService } from './players.service';
import { AnswersModule } from 'src/answers/answers.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    AnswersModule,
  ],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
