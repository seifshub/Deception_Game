import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesResolver } from './games.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { User } from '../users/entities/user.entity';
import { CommonModule } from '../common/common.module';
import { UsersModule } from 'src/users/users.module';
import { GameValidator } from './validators/game.validator';
import { GamesGateway } from './games.gateway';
import { RoundsModule } from 'src/rounds/rounds.module';
import { PromptsService } from 'src/prompts/prompts.service';
import { TopicsService } from 'src/topics/topics.service';
import { PlayersModule } from 'src/players/players.module';
import { AnswersModule } from 'src/answers/answers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, User]),
    CommonModule,
    UsersModule,
    RoundsModule,
    PromptsService,
    TopicsService,
    AnswersModule,
    PlayersModule,
  ],
  providers: [GamesResolver, GamesService, GameValidator, GamesGateway],
  exports: [GamesService],
})
export class GamesModule {}
