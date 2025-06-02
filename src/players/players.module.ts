import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { PlayersService } from './players.service';
import { AnswersModule } from 'src/answers/answers.module';
import { Vote } from 'src/votes/entities/vote.entity';
import { VotesModule } from 'src/votes/votes.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    AnswersModule,
    VotesModule,
  ],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
