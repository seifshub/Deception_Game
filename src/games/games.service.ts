import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Or, Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { User } from '../users/entities/user.entity';
import { GameState } from './enums/game.state.enum';
import { GameValidator } from './validators/game.validator';
import { Visibility } from './enums/game.visibilty.enum';
import { FriendshipService } from 'src/users/friendship.service';

@Injectable()
export class GamesService extends GenericCrudService<
  Game,
  CreateGameInput,
  UpdateGameInput
> {
  constructor(
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly friendshipService: FriendshipService,
    private readonly gameValidator: GameValidator,
  ) {
    super(gameRepository);
  }

  async createGameWithHost(createGameInput: CreateGameInput, hostId: number): Promise<Game> {
    const host = await this.gameValidator.validateUserExists(hostId);
    
    const game = this.gameRepository.create({
      ...createGameInput,
      current_size: 1,
      host,
      players: [host],
    });
    
    return this.gameRepository.save(game);
  }

  async joinGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    const user = await this.gameValidator.validateUserExists(userId);
    
    this.gameValidator.validateGameState(game, GameState.PREPARING);
    this.gameValidator.validateUserNotInGame(game, userId);
    this.gameValidator.validateGameHasCapacity(game);
    await this.gameValidator.validateGameVisibility(game, userId);

    game.players.push(user);
    game.current_size += 1;
    
    return this.gameRepository.save(game);
  }

  async updateGame(
    gameId: number,
    updateGameInput: UpdateGameInput,
    userId: number,
  ): Promise<Game> {
    this.gameValidator.validateUserIdProvided(userId);
    
    const game = await this.gameValidator.validateGameExists(gameId);
    this.gameValidator.validateUserIsHost(game, userId);

    Object.assign(game, updateGameInput);
    
    return this.gameRepository.save(game);
  }

  async startGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    
    this.gameValidator.validateUserIsHost(game, userId);
    this.gameValidator.validateGameState(game, GameState.PREPARING);
    this.gameValidator.validateMinimumPlayers(game, 2);
    
    game.status = GameState.IN_PROGRESS;
    
    return this.gameRepository.save(game);
  }

  async endGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    
    this.gameValidator.validateUserIsHost(game, userId);
    this.gameValidator.validateGameState(game, GameState.IN_PROGRESS);
    
    game.status = GameState.FINISHED;
    
    return this.gameRepository.save(game);
  }

  async leaveGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    
    this.gameValidator.validateUserIsPlayer(game, userId);
    
    // If the host is leaving, reassign or cancel
    if (game.host.id === userId) {
      if (game.status !== GameState.PREPARING || game.players.length <= 1) {
        game.status = GameState.ABORTED;
      } else {
        // Assign a new host (first player who isn't the current host)
        const newHost = game.players.find(player => player.id !== userId);
        if (newHost) {
          game.host = newHost;
        } else {
          // No new host can be found
          game.status = GameState.ABORTED;
        }
      }
    }
    
    // Remove player
    const playerIndex = game.players.findIndex(player => player.id === userId);
    game.players.splice(playerIndex, 1);
    game.current_size -= 1;
    
    return this.gameRepository.save(game);
  }

async findAvailableGames(userId: number): Promise<Game[]> {
    const publicGames = await this.gameRepository.find({
      where: {
        status: GameState.PREPARING,
        visibility: Visibility.PUBLIC,
      },
      relations: ['host', 'players'],
    });
    
    const user = await this.gameValidator.validateUserExists(userId);
    const userFriends = await this.friendshipService.getFriends(userId);
    const friendIds = userFriends.map(friend => friend.id);
    
    if (friendIds.length === 0) {
      return publicGames; 
    }
    
    // Get friends-only games where the host is a friend of the user
    const friendsOnlyGames = await this.gameRepository.find({
      where: {
        status: GameState.PREPARING,
        visibility: Visibility.FRIENDS_ONLY,
        host: {
          id: In(friendIds),
        },
      },
      relations: ['host', 'players'],
    });
    
    return [...publicGames, ...friendsOnlyGames];
  }

    async retrieveCurrentGame(userId: number): Promise<Game | null> {
        // This method retrieves the game the user is currently in, if any
        const user = await this.gameValidator.validateUserExists(userId);
        
        const game = await this.gameRepository.findOne({
            where: {
                players: { id: user.id },
                status: In([GameState.IN_PROGRESS, GameState.PREPARING]),
            },
            relations: ['host', 'players'],
        });

    return game || null;
    }

  // These methods provide convenience wrappers around validator functions
  async verifyGameExists(gameId: number): Promise<Game> {
    return this.gameValidator.validateGameExists(gameId);
  }

  async verifyPlayerInGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    this.gameValidator.validateUserIsPlayer(game, userId);
    return game;
  }

  async verifyHostInGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    this.gameValidator.validateUserIsHost(game, userId);
    return game;
  }

  async checkGameState(gameId: number, expectedState: GameState): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    this.gameValidator.validateGameState(game, expectedState);
    return game;
  }
}