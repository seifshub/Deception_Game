import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './entities/round.entity';
import { RoundsService } from './rounds.service';
import { GamesModule } from '../games/games.module';
import { PromptsModule } from '../prompts/prompts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Round]),
    GamesModule,
    PromptsModule
  ],
  providers: [RoundsService],
  exports: [RoundsService]
})
export class RoundsModule {}
