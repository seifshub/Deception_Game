import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseStatus } from '../enums/response.status.enum';
import { PlayerResponse } from '../entities/response.entity';
import { Game } from '../../games/entities/game.entity';
import { User } from '../../users/entities/user.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { GameState, GameSubstate } from '../../games/enums';

@Injectable()
export class PlayerResponseValidator {
  constructor(
    @InjectRepository(PlayerResponse)
    private readonly playerResponseRepository: Repository<PlayerResponse>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
  ) {}

  async validatePlayerResponseExists(responseId: number): Promise<PlayerResponse> {
    const response = await this.playerResponseRepository.findOne({
      where: { id: responseId },
      relations: ['player', 'game', 'question'],
    });

    if (!response) {
      throw new NotFoundException(`Player response with ID ${responseId} not found`);
    }

    return response;
  }

  async validateUserExists(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async validateGameExists(gameId: number): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['players', 'host'],
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    return game;
  }

  async validatePromptExists(promptId: number): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({ where: { id: promptId } });
    if (!prompt) {
      throw new NotFoundException(`Prompt with ID ${promptId} not found`);
    }
    return prompt;
  }

  validateUserIsPlayer(game: Game, userId: number): void {
    const isPlayer = game.players.some(player => player.id === userId);
    if (!isPlayer) {
      throw new ForbiddenException('User is not a player in this game');
    }
  }

  validateGameInResponsePhase(game: Game): void {
    if (game.status !== GameState.IN_PROGRESS || game.substate !== GameSubstate.GIVING_ANSWER) {
      throw new BadRequestException('Game is not in answer submission phase');
    }
  }

  validateResponseLength(response: string, maxLength: number = 200): void {
    if (!response || response.trim().length === 0) {
      throw new BadRequestException('Response cannot be empty');
    }

    if (response.length > maxLength) {
      throw new BadRequestException(`Response cannot exceed ${maxLength} characters`);
    }
  }

  async validateNoDuplicateResponse(gameId: number, userId: number, round: number): Promise<void> {
    const existingResponse = await this.playerResponseRepository.findOne({
      where: {
        game: { id: gameId },
        player: { id: userId },
        round,
      },
    });

    if (existingResponse && existingResponse.status !== ResponseStatus.DRAFT) {
      throw new BadRequestException('Player has already submitted a response for this round');
    }
  }

  validateResponseDeadline(submissionDeadline: Date): void {
    const now = new Date();
    if (now > submissionDeadline) {
      throw new BadRequestException('Response submission deadline has passed');
    }
  }

  validateResponseCanBeUpdated(playerResponse: PlayerResponse): void {
    if (playerResponse.status === ResponseStatus.SUBMITTED) {
      throw new BadRequestException('Cannot modify a submitted response');
    }

    if (playerResponse.status === ResponseStatus.TIMED_OUT) {
      throw new BadRequestException('Cannot modify a timed out response');
    }
  }

  validateUserOwnsResponse(playerResponse: PlayerResponse, userId: number): void {
    if (playerResponse.player.id !== userId) {
      throw new ForbiddenException('User does not own this response');
    }
  }
}