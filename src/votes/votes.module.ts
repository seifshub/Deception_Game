import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { PlayerVoteService } from './votes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerVote } from './entities/votes.entity';
import { PlayerVoteValidator } from './validators/vote.validator';
import { ResponsesModule } from '../responses/responses.module';

@Module({
  imports: [ TypeOrmModule.forFeature([PlayerVote]), ResponsesModule],
  controllers: [VotesController],
  providers: [PlayerVoteService, PlayerVoteValidator],
  exports: [PlayerVoteService, PlayerVoteValidator],
})
export class VotesModule {} 
