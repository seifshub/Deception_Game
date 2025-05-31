import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '../entities/game.entity';
import { User } from '../../users/entities/user.entity';
import { GameState } from '../enums/game.state.enum';
import { Visibility } from '../enums/game.visibilty.enum';
import { FriendshipService } from '../../users/friendship.service';

@Injectable()
export class GameValidator {
  constructor(
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly friendshipService: FriendshipService,
  ) {}

  async validateGameExists(gameId: number): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['host', 'players'],
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    return game;
  }

  async validateUserExists(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  validateGameState(game: Game, expectedState: GameState): void {
    if (game.status !== expectedState) {
      throw new ForbiddenException(
        `Game with id ${game.id} is not in the expected state: ${expectedState}`,
      );
    }
  }

  validateUserIsHost(game: Game, userId: number): void {
    if (game.host.id !== userId) {
      throw new ForbiddenException(
        `User with id ${userId} is not the host of this game`,
      );
    }
  }

  validateUserIsPlayer(game: Game, userId: number): void {
    const isPlayer = game.players.some(player => player.id === userId);
    
    if (!isPlayer) {
      throw new ForbiddenException(
        `User with id ${userId} is not a player in this game`,
      );
    }
  }

  validateUserNotInGame(game: Game, userId: number): void {
    const isPlayer = game.players.some(player => player.id === userId);
    
    if (isPlayer) {
      throw new ForbiddenException(
        `User with id ${userId} is already in the game`,
      );
    }
  }

  validateGameHasCapacity(game: Game): void {
    if (game.current_size >= game.size) {
      throw new ForbiddenException(`Game with id ${game.id} is full`);
    }
  }

  async validateGameVisibility(game: Game, userId: number): Promise<void> {
    if (game.visibility === Visibility.PRIVATE) {
        throw new ForbiddenException(`Game with id ${game.id} is private`);
    }

    if (game.visibility === Visibility.FRIENDS_ONLY) {
        await this.validateUserIsFriendOfHost(game, userId);
    }
}

  async validateUserIsFriendOfHost(game: Game, userId: number): Promise<void> {
    const friends = await this.friendshipService.getFriends(userId);
    const isFriend = friends.some(friend => friend.id === game.host.id);
    
    if (!isFriend) {
      throw new ForbiddenException(
        `User with id ${userId} is not a friend of the game host`,
      );
    }
  }

  validateUserIdProvided(userId: number): void {
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }
  }

  validateMinimumPlayers(game: Game, minPlayers: number = 2): void {
    if (game.current_size < minPlayers) {
      throw new ForbiddenException(
        `Cannot start a game with fewer than ${minPlayers} players`,
      );
    }
  }
}