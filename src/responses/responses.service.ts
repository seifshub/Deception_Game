import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlayerResponseDto, UpdatePlayerResponseDto } from './dto';
import { PlayerResponse } from './entities/response.entity';
import { PlayerResponseValidator } from './validators/response.validator';
import { ResponseStatus } from './enums';

@Injectable()
export class PlayerResponseService {
  constructor(
    @InjectRepository(PlayerResponse)
    private readonly playerResponseRepository: Repository<PlayerResponse>,
    private readonly playerResponseValidator: PlayerResponseValidator,
  ) {}

  async createResponse(createDto: CreatePlayerResponseDto, userId: number): Promise<PlayerResponse> {
    const { gameId, promptId, response, roundId } = createDto;

    // Validations
    const game = await this.playerResponseValidator.validateGameExists(gameId);
    const user = await this.playerResponseValidator.validateUserExists(userId);
    const prompt = await this.playerResponseValidator.validatePromptExists(promptId);
    const round = await this.playerResponseValidator.validateRoundExists(roundId);

    this.playerResponseValidator.validateUserIsPlayer(game, userId);
    this.playerResponseValidator.validateGameInResponsePhase(game);
    this.playerResponseValidator.validateResponseLength(response);
    await this.playerResponseValidator.validateNoDuplicateResponse(gameId, userId, roundId);

    const playerResponse = this.playerResponseRepository.create({
      response,
      status: ResponseStatus.DRAFT,
      player: user,
      game: game,
      prompt: prompt,
      round: round,
    });

    return this.playerResponseRepository.save(playerResponse);
  }

  async submitResponse(responseId: number, userId: number, submissionDeadline: Date): Promise<PlayerResponse> {
    const playerResponse = await this.playerResponseValidator.validatePlayerResponseExists(responseId);
    
    this.playerResponseValidator.validateUserOwnsResponse(playerResponse, userId);
    this.playerResponseValidator.validateResponseCanBeUpdated(playerResponse);
    this.playerResponseValidator.validateResponseDeadline(submissionDeadline);

    playerResponse.status = ResponseStatus.SUBMITTED;
    playerResponse.submittedAt = new Date();

    return this.playerResponseRepository.save(playerResponse);
  }

  async updateResponse(responseId: number, updateDto: UpdatePlayerResponseDto, userId: number): Promise<PlayerResponse> {
    const playerResponse = await this.playerResponseValidator.validatePlayerResponseExists(responseId);
    
    this.playerResponseValidator.validateUserOwnsResponse(playerResponse, userId);
    this.playerResponseValidator.validateResponseCanBeUpdated(playerResponse);
    this.playerResponseValidator.validateResponseLength(updateDto.response);

    Object.assign(playerResponse, updateDto);
    return this.playerResponseRepository.save(playerResponse);
  }

  async getResponsesByGameAndRound(gameId: number, roundId: number): Promise<PlayerResponse[]> {
    return this.playerResponseRepository.find({
      where: {
        game: { id: gameId },
        round: { id: roundId },
        status: ResponseStatus.SUBMITTED,
      },
      relations: ['player'],
    });
  }

  async getPlayerResponse(gameId: number, userId: number, roundId: number): Promise<PlayerResponse | null> {
    return this.playerResponseRepository.findOne({
      where: {
        game: { id: gameId },
        player: { id: userId },
        round: { id: roundId },
      },
      relations: ['player', 'game', 'prompt'],
    });
  }

  async markResponseAsTimedOut(gameId: number, userId: number, roundId: number): Promise<PlayerResponse | null> {
    const response = await this.getPlayerResponse(gameId, userId, roundId);
    
    if (response && response.status === ResponseStatus.DRAFT) {
      response.status = ResponseStatus.TIMED_OUT;
      return this.playerResponseRepository.save(response);
    }
    
    return response;
  }

  async updateResponsePoints(responseId: number, points: number): Promise<PlayerResponse> {
    const response = await this.playerResponseValidator.validatePlayerResponseExists(responseId);
    response.points = points;
    return this.playerResponseRepository.save(response);
  }

  async getSubmittedResponsesCount(gameId: number, roundId: number): Promise<number> {
    return this.playerResponseRepository.count({
      where: {
        game: { id: gameId },
        round: { id: roundId },
        status: ResponseStatus.SUBMITTED,
      },
    });
  }
}