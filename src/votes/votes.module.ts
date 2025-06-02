import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { VotesService } from './votes.service';
import { Player } from '../players/entities/player.entity';
import { Answer } from '../answers/answers.entity';
import { AnswersModule } from 'src/answers/answers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote]),
    AnswersModule,
  ],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
