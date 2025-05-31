import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerVote } from './entities/votes.entity';

@Module({
  imports: [ TypeOrmModule.forFeature([PlayerVote])],
  controllers: [VotesController],
  providers: [VotesService]
})
export class VotesModule {}
