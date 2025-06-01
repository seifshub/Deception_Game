import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameValidator } from './game.validator';
import { User } from '../../users/entities/user.entity';
import { FriendshipService } from '../../users/friendship.service';
import { GameState } from '../enums/game.state.enum';
import { Visibility } from '../enums/game.visibilty.enum';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '../../users/enums/role.enum';
import { GameSubstate } from '../enums/game.substate.enum';
import { Game } from '../entities/game.entity';

describe('GameValidator', () => {
  let validator: GameValidator;
  let gameRepository: Repository<Game>;
  let userRepository: Repository<User>;
  let friendshipService: FriendshipService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameValidator,
        {
          provide: getRepositoryToken(Game),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: FriendshipService,
          useValue: {
            getFriends: jest.fn(),
          },
        },
      ],
    }).compile();

    validator = module.get<GameValidator>(GameValidator);
    gameRepository = module.get<Repository<Game>>(getRepositoryToken(Game));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    friendshipService = module.get<FriendshipService>(FriendshipService);
  });

  describe('validateMinimumPlayers', () => {
    it('should not throw if game has minimum players', () => {
      const gameWithPlayers = { ...mockGame, current_size: 2 };
      expect(() => validator.validateMinimumPlayers(gameWithPlayers, 2)).not.toThrow();
    });

    it('should throw ForbiddenException if game has fewer than minimum players', () => {
      expect(() => validator.validateMinimumPlayers(mockGame, 2)).toThrow(ForbiddenException);
    });
  });
  describe('validateUserIdProvided', () => {
    it('should not throw if user ID is provided', () => {
      expect(() => validator.validateUserIdProvided(1)).not.toThrow();
    });

    it('should throw ForbiddenException if user ID is not provided', () => {
      expect(() => validator.validateUserIdProvided(null as unknown as number)).toThrow(ForbiddenException);
      expect(() => validator.validateUserIdProvided(undefined as unknown as number)).toThrow(ForbiddenException);
    });
  });
});
