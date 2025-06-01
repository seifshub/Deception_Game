import { Resolver, Mutation, Args, Query, ID } from '@nestjs/graphql';
import { Game } from './entities/game.entity';
import { GamesService } from './games.service';
import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';
import { GenericResolver } from '../common/resolvers/generic.resolver';
import { Type, UseGuards } from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { ActiveUserData } from '../auth/interfaces/active-user-data.interface';
import { SessionGuard } from '../auth/guards/session.guard';

@UseGuards(SessionGuard)
@Resolver(() => Game)
export class GamesResolver extends GenericResolver(
  Game as Type<Game> & Game,
  CreateGameInput,
  UpdateGameInput,
) {
  constructor(private readonly gamesService: GamesService) {
    super(gamesService);
  }

  @Mutation(() => Game)
  async create(
    @Args('createInput') createInput: CreateGameInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Game> {
    return this.gamesService.createGameWithHost(createInput, user.sub);
  }

  @Mutation(() => Game) 
  async createGame(
    @Args('createGameInput') createGameInput: CreateGameInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Game> {
    return this.gamesService.createGameWithHost(createGameInput, user.sub);
  }

  @Mutation(() => Game)
  async joinGame(
    @Args('gameId', { type: () => ID }) gameId: number,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Game> {
    return this.gamesService.joinGame(gameId, user.sub);
  }

  @Mutation(() => Game)
  async update(
    @Args('gameId', { type: () => ID }) gameId: number,
    @Args('updateInput') updateInput: UpdateGameInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Game> {
    return this.gamesService.updateGame(gameId, updateInput, user.sub);
  }

  @Mutation(() => Game)
  async updateGame(
    @Args('gameId', { type: () => ID }) gameId: number,
    @Args('updateGameInput') updateGameInput: UpdateGameInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Game> {
    return this.gamesService.updateGame(gameId, updateGameInput, user.sub);
  }

  @Mutation(() => Game)
  async leaveGame(
    @Args('gameId', { type: () => ID }) gameId: number,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Game> {
    return this.gamesService.leaveGame(gameId, user.sub);
    }

}