import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesResolver } from './games.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { User } from '../users/entities/user.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, User]),
    CommonModule,
  ],
  providers: [GamesResolver, GamesService],
  exports: [GamesService],
})
export class GamesModule {}