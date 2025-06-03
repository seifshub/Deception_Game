import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Or, Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { User } from '../users/entities/user.entity';
import { GameState } from './enums/game.state.enum';
import { GameValidator } from './validators/game.validator';
import { Visibility } from './enums/game.visibilty.enum';
import { FriendshipService } from 'src/users/friendship.service';
import { GameSubstate } from './enums/game.substate.enum';
import { ForbiddenError } from '@nestjs/apollo';
import { RoundsService } from 'src/rounds/rounds.service';
import { PromptsService } from 'src/prompts/prompts.service';
import { PlayersService } from 'src/players/players.service';
import { Round } from 'src/rounds/entities/round.entity';
import { CreateAnswerDto } from 'src/answers/dtos/create-answer.dto';
import { CreateVoteInput } from 'src/votes/dto/create-vote.input';
import { AnswersService } from 'src/answers/answers.service';
import { Vote } from 'src/votes/entities/vote.entity';

@Injectable()
export class GamesService extends GenericCrudService<
  Game,
  DeepPartial<Game>,
  DeepPartial<Game>
> {
  constructor(
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
    private readonly friendshipService: FriendshipService,
    private readonly gameValidator: GameValidator,
    private readonly roundsService: RoundsService,
    private readonly promptService: PromptsService,
    private readonly playersService: PlayersService,
    private readonly answersService: AnswersService,
  ) {
    super(gameRepository);
  }

  async createGameWithHost(createGameInput: CreateGameInput, hostId: number): Promise<Game> {
    const host = await this.gameValidator.validateUserExists(hostId);
    const player = await this.playersService.createPlayerProfile(host);

    return this.create({
      ...createGameInput,
      host,
      playerProfiles: [player],
    });

  }

  async joinGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    const user = await this.gameValidator.validateUserExists(userId);

    this.gameValidator.validateGameState(game, GameState.PREPARING);
    this.gameValidator.validateUserNotInGame(game, userId);
    this.gameValidator.validateGameHasCapacity(game);
    await this.gameValidator.validateGameVisibility(game, userId);

    const player = await this.playersService.createPlayerProfile(user);

    game.playerProfiles.push(player);

    return this.update(gameId, game);
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

    return this.update(gameId, game);
  }

  async startGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);

    this.gameValidator.validateUserIsHost(game, userId);
    this.gameValidator.validateGameState(game, GameState.PREPARING);
    this.gameValidator.validateMinimumPlayers(game, 2);

    game.status = GameState.IN_PROGRESS;

    return this.update(gameId, game);
  }

  async endGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);

    this.gameValidator.validateUserIsHost(game, userId);
    this.gameValidator.validateGameState(game, GameState.FINAL_RESULTS);

    game.status = GameState.FINISHED;

    return this.update(gameId, game);
  }

  async leaveGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);

    this.gameValidator.validateUserIsPlayer(game, userId);

    // If the host is leaving, reassign or cancel
    if (game.host.id === userId) {
      if (game.status !== GameState.PREPARING || game.playerProfiles.length <= 1) {
        game.status = GameState.ABORTED;
      } else {
        // Assign a new host (first player who isn't the current host)
        const HostPlayer = game.playerProfiles.find(player => player.user.id !== userId);
        if (HostPlayer) {
          game.host = HostPlayer.user;
        } else {
          // No new host can be found
          game.status = GameState.ABORTED;
        }
      }
    }

    // Remove player
    const playerToDelete = game.playerProfiles.find(player => player.id === userId);
    if (!playerToDelete) {// not nescassary since gameValidator.validateUserIsPlayer already checks this but I don't want to see a warning
      throw new ForbiddenError(`Player with ID ${userId} is not in the game.`);
    }
    this.playersService.delete(playerToDelete.id);

    this.update(gameId, game);

    return this.findOne(gameId);
  }

  async findAvailableGames(userId: number): Promise<Game[]> {
    const publicGames = await this.findBy(
      {
        status: GameState.PREPARING,
        visibility: Visibility.PUBLIC,
      }    
    );

    await this.gameValidator.validateUserExists(userId);
    const userFriends = await this.friendshipService.getFriends(userId);
    const friendIds = userFriends.map(friend => friend.id);

    if (friendIds.length === 0) {
      return publicGames;
    }

    // Get friends-only games where the host is a friend of the user
    const friendsOnlyGames = await this.findBy(
      {
        status: GameState.PREPARING,
        visibility: Visibility.FRIENDS_ONLY,
        host: {
          id: In(friendIds),
        },
    });

    return [...publicGames, ...friendsOnlyGames];
  }

  async retrieveCurrentGame(userId: number): Promise<Game | null> {
    // This method retrieves the game the user is currently in, if any
    const user = await this.gameValidator.validateUserExists(userId);

    const game = await this.findOneBy({
        playerProfiles: { user: { id: user.id } },
        status: In([GameState.IN_PROGRESS, GameState.PREPARING]),
    });

    return game || null;
  }

  async addRoundToGame(gameId: number, topicId: number): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);

    this.gameValidator.validateGameState(game, GameState.IN_PROGRESS);

    const currentRound = game.gameRounds.length;
    const prompt = await this.promptService.getRandomPrompt(topicId);

    if (currentRound >= game.totalRounds) {
      throw new ForbiddenError(`Cannot add more rounds, game has already reached the total of ${game.totalRounds} rounds.`);
    }

    const round = await this.roundsService.createRound(game, prompt, currentRound + 1);

    game.gameRounds.push(round);
    game.substate = GameSubstate.GIVING_ANSWER; // Set substate to giving answer

    return this.gameRepository.save(game);
  }

  async retrieveCurrentRound(game: Game): Promise<Round> {

    // This method retrieves the current round of the game, if any
    if (!game || !game.gameRounds || game.gameRounds.length === 0) {
      throw new ForbiddenError(`Game with ID ${game.id} has no rounds.`);
    }

    const currentRound = game.gameRounds[game.gameRounds.length - 1];

    if (!currentRound) {
      throw new ForbiddenError(`No current round found for game with ID ${game.id}.`);
    }

    return currentRound;
  }

  async submitAnswer(playerId: number, createAnswerDto: CreateAnswerDto, round: Round): Promise<void> {
    this.playersService.addAnswerToPlayer(playerId, createAnswerDto, round);
  }

  async submitVote(playerId: number, createVoteInput: CreateVoteInput, roundNumber: number): Promise<void> {
    this.playersService.addVoteToPlayer(playerId, createVoteInput, roundNumber);
  }

  async switchState(gameId: number, currentState: GameState, newState: GameState): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);
    this.gameValidator.validateGameState(game, currentState);

    game.status = newState;
    if (newState === GameState.FINISHED) {
      game.substate = GameSubstate.NA; // Reset substate when game is finished
    }
    return this.update(gameId, game);

  }

  async switchSubstate(gameId: number, currentSubState, newSubstate: GameSubstate): Promise<Game> {
    const game = await this.gameValidator.validateGameExists(gameId);

    this.gameValidator.validateGameSubstate(game, currentSubState);

    game.substate = newSubstate;

    return this.update(gameId, game);
  }

  async addScoreToPlayer(playerId: number, scoreToAdd: number): Promise<void> {
    this.playersService.addPlayerScore(playerId, scoreToAdd);
  }

  async getVotesForAnswer(answerId: number): Promise<Vote[]> {
    return this.answersService.getVotesForAnswer(answerId);

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