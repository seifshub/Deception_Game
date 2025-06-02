import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { PlayersService } from './players.service';
import { GamesModule } from 'src/games/games.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    GamesModule
  ],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
