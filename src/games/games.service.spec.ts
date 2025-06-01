import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamesService } from './games.service';
import { User } from '../users/entities/user.entity';
import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';
import { GameState } from './enums/game.state.enum';
import { GameValidator } from './validators/game.validator';
import { Visibility } from './enums/game.visibilty.enum';
import { Role } from '../users/enums/role.enum';
import { GameSubstate } from './enums/game.substate.enum';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Game } from './entities/game.entity';

describe('GamesService', () => {
  let service: GamesService;
  let gameRepository: Repository<Game>;
  let userRepository: Repository<User>;
  let gameValidator: GameValidator;

  // Mock user data
  const mockHost: User = {
    id: 1,
    username: 'host',
    email: 'host@example.com',
    password: 'hashedpassword',
    role: Role.Regular,
    createdAt: new Date(),
    updatedAt: new Date(),
    sentFriendRequests: [],
    receivedFriendRequests: [],
    hostedGames: [],
    joinedGames: [],
  };

  const mockPlayer: User = {
    id: 2,
    username: 'player',
    email: 'player@example.com',
    password: 'hashedpassword',
    role: Role.Regular,
    createdAt: new Date(),
    updatedAt: new Date(),
    sentFriendRequests: [],
    receivedFriendRequests: [],
    hostedGames: [],
    joinedGames: [],
  };

  // Mock game data
  const mockGame: Game = {
    id: 1,
    name: 'Test Game',
    size: 5,
    current_size: 1,
    status: GameState.PREPARING,
    substate: GameSubstate.NA,
    visibility: Visibility.PUBLIC,
    host: mockHost,
    players: [mockHost],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateGameInput: CreateGameInput = {
    name: 'New Game',
    size: 4,
    visibility: Visibility.PUBLIC,
  };

  const mockUpdateGameInput: UpdateGameInput = {
    name: 'Updated Game',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: getRepositoryToken(Game),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: GameValidator,
          useValue: {
            validateGameExists: jest.fn(),
            validateUserExists: jest.fn(),
            validateGameState: jest.fn(),
            validateUserNotInGame: jest.fn(),
            validateGameHasCapacity: jest.fn(),
            validateGameVisibility: jest.fn(),
            validateUserIsHost: jest.fn(),
            validateUserIsPlayer: jest.fn(),
            validateMinimumPlayers: jest.fn(),
            validateUserIdProvided: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    gameRepository = module.get<Repository<Game>>(getRepositoryToken(Game));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    gameValidator = module.get<GameValidator>(GameValidator);
  });

  describe('createGameWithHost', () => {
    it('should create a game with the user as host', async () => {
      jest.spyOn(gameValidator, 'validateUserExists').mockResolvedValue(mockHost);
      jest.spyOn(gameRepository, 'create').mockReturnValue(mockGame);
      jest.spyOn(gameRepository, 'save').mockResolvedValue(mockGame);

      const result = await service.createGameWithHost(mockCreateGameInput, 1);

      expect(gameValidator.validateUserExists).toHaveBeenCalledWith(1);
      expect(gameRepository.create).toHaveBeenCalledWith({
        ...mockCreateGameInput,
        host: mockHost,
        players: [mockHost],
        current_size: 1,
      });
      expect(gameRepository.save).toHaveBeenCalledWith(mockGame);
      expect(result).toEqual(mockGame);
    });
  });

  describe('joinGame', () => {
    it('should allow a user to join a game', async () => {
      const gameWithNewPlayer = {
        ...mockGame,
        players: [...mockGame.players, mockPlayer],
        current_size: 2,
      };

      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(mockGame);
      jest.spyOn(gameValidator, 'validateUserExists').mockResolvedValue(mockPlayer);
      jest.spyOn(gameRepository, 'save').mockResolvedValue(gameWithNewPlayer);

      const result = await service.joinGame(1, 2);

      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserExists).toHaveBeenCalledWith(2);
      expect(gameValidator.validateGameState).toHaveBeenCalledWith(mockGame, GameState.PREPARING);
      expect(gameValidator.validateUserNotInGame).toHaveBeenCalledWith(mockGame, 2);
      expect(gameValidator.validateGameHasCapacity).toHaveBeenCalledWith(mockGame);
      expect(gameValidator.validateGameVisibility).toHaveBeenCalledWith(mockGame, 2);
      expect(gameRepository.save).toHaveBeenCalled();
      expect(result).toEqual(gameWithNewPlayer);
    });
  });

  describe('updateGame', () => {
    it('should update a game if the user is the host', async () => {
      const updatedGame = { ...mockGame, name: 'Updated Game' };

      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(mockGame);
      jest.spyOn(gameRepository, 'save').mockResolvedValue(updatedGame);

      const result = await service.updateGame(1, mockUpdateGameInput, 1);

      expect(gameValidator.validateUserIdProvided).toHaveBeenCalledWith(1);
      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserIsHost).toHaveBeenCalledWith(mockGame, 1);
      expect(gameRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedGame);
    });
  });

  describe('startGame', () => {
    it('should start a game if conditions are met', async () => {
      const startedGame = { 
        ...mockGame, 
        status: GameState.IN_PROGRESS 
      };

      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(mockGame);
      jest.spyOn(gameRepository, 'save').mockResolvedValue(startedGame);

      const result = await service.startGame(1, 1);

      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserIsHost).toHaveBeenCalledWith(mockGame, 1);
      expect(gameValidator.validateGameState).toHaveBeenCalledWith(mockGame, GameState.PREPARING);
      expect(gameValidator.validateMinimumPlayers).toHaveBeenCalledWith(mockGame, 2);
      expect(gameRepository.save).toHaveBeenCalled();
      expect(result).toEqual(startedGame);
      expect(result.status).toBe(GameState.IN_PROGRESS);
    });
  });

  describe('endGame', () => {
    it('should end a game if conditions are met', async () => {
      const inProgressGame = { 
        ...mockGame, 
        status: GameState.IN_PROGRESS 
      };
      
      const endedGame = { 
        ...inProgressGame, 
        status: GameState.FINISHED 
      };

      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(inProgressGame);
      jest.spyOn(gameRepository, 'save').mockResolvedValue(endedGame);

      const result = await service.endGame(1, 1);

      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserIsHost).toHaveBeenCalledWith(inProgressGame, 1);
      expect(gameValidator.validateGameState).toHaveBeenCalledWith(inProgressGame, GameState.IN_PROGRESS);
      expect(gameRepository.save).toHaveBeenCalled();
      expect(result).toEqual(endedGame);
      expect(result.status).toBe(GameState.FINISHED);
    });
  });

  describe('leaveGame', () => {
    it('should allow a player to leave a game', async () => {
      const gameWithTwoPlayers = {
        ...mockGame,
        players: [mockHost, mockPlayer],
        current_size: 2,
      };
      
      const gameAfterLeaving = {
        ...mockGame,
        players: [mockHost],
        current_size: 1,
      };

      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(gameWithTwoPlayers);
      jest.spyOn(gameRepository, 'save').mockResolvedValue(gameAfterLeaving);

      const result = await service.leaveGame(1, 2);

      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserIsPlayer).toHaveBeenCalledWith(gameWithTwoPlayers, 2);
      expect(gameRepository.save).toHaveBeenCalled();
      expect(result).toEqual(gameAfterLeaving);
      expect(result.current_size).toBe(1);
    });

    it('should abort the game if the host leaves during PREPARING state and no other players', async () => {
      const gameWithHostOnly = {
        ...mockGame,
        players: [mockHost],
        current_size: 1,
      };
      
      const abortedGame = {
        ...gameWithHostOnly,
        status: GameState.ABORTED,
        players: [],
        current_size: 0,
      };

      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(gameWithHostOnly);
      jest.spyOn(gameRepository, 'save').mockResolvedValue(abortedGame);

      const result = await service.leaveGame(1, 1);

      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserIsPlayer).toHaveBeenCalledWith(gameWithHostOnly, 1);
      expect(gameRepository.save).toHaveBeenCalled();
      expect(result).toEqual(abortedGame);
      expect(result.status).toBe(GameState.ABORTED);
    });

    it('should assign a new host if the host leaves during PREPARING state with other players', async () => {
      const gameWithTwoPlayers = {
        ...mockGame,
        players: [mockHost, mockPlayer],
        current_size: 2,
      };
      
      const gameWithNewHost = {
        ...gameWithTwoPlayers,
        host: mockPlayer,
        players: [mockPlayer],
        current_size: 1,
      };

      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(gameWithTwoPlayers);
      jest.spyOn(gameRepository, 'save').mockResolvedValue(gameWithNewHost);

      const result = await service.leaveGame(1, 1);

      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserIsPlayer).toHaveBeenCalledWith(gameWithTwoPlayers, 1);
      expect(gameRepository.save).toHaveBeenCalled();
      expect(result).toEqual(gameWithNewHost);
      expect(result.host).toEqual(mockPlayer);
    });
  });

  describe('findAvailableGames', () => {
    it('should return available public games', async () => {
      const games = [mockGame];
      jest.spyOn(gameRepository, 'find').mockResolvedValue(games);

      const result = await service.findAvailableGames(1);

      expect(gameRepository.find).toHaveBeenCalledWith({
        where: {
          status: GameState.PREPARING,
          visibility: Visibility.PUBLIC,
        },
        relations: ['host', 'players'],
      });
      expect(result).toEqual(games);
    });
  });

  describe('convenience methods', () => {
    it('verifyGameExists should call validator', async () => {
      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(mockGame);
      
      const result = await service.verifyGameExists(1);
      
      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGame);
    });

    it('verifyPlayerInGame should call validators', async () => {
      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(mockGame);
      
      const result = await service.verifyPlayerInGame(1, 1);
      
      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserIsPlayer).toHaveBeenCalledWith(mockGame, 1);
      expect(result).toEqual(mockGame);
    });

    it('verifyHostInGame should call validators', async () => {
      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(mockGame);
      
      const result = await service.verifyHostInGame(1, 1);
      
      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateUserIsHost).toHaveBeenCalledWith(mockGame, 1);
      expect(result).toEqual(mockGame);
    });

    it('checkGameState should call validators', async () => {
      jest.spyOn(gameValidator, 'validateGameExists').mockResolvedValue(mockGame);
      
      const result = await service.checkGameState(1, GameState.PREPARING);
      
      expect(gameValidator.validateGameExists).toHaveBeenCalledWith(1);
      expect(gameValidator.validateGameState).toHaveBeenCalledWith(mockGame, GameState.PREPARING);
      expect(result).toEqual(mockGame);
    });
  });
});