import { VoteStatus, VoteType } from '../enums';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PlayerVote } from '../entities/votes.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerResponse } from '../../responses/entities/response.entity';
import { Game } from '../../games/entities/game.entity';
import { User } from '../../users/entities/user.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { Repository } from 'typeorm';
import { GameState, GameSubstate} from '../../games/enums'
import { ResponseStatus } from '../../responses/enums'

@Injectable()
export class PlayerVoteValidator {
  constructor(
    @InjectRepository(PlayerVote)
    private readonly playerVoteRepository: Repository<PlayerVote>,
    @InjectRepository(PlayerResponse)
    private readonly playerResponseRepository: Repository<PlayerResponse>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
  ) {}

  async validatePlayerVoteExists(voteId: number): Promise<PlayerVote> {
    const vote = await this.playerVoteRepository.findOne({
      where: { id: voteId },
      relations: ['player', 'game', 'prompt', 'votedResponse'],
    });

    if (!vote) {
      throw new NotFoundException(`Player vote with ID ${voteId} not found`);
    }

    return vote;
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

  validateUserIsPlayer(game: Game, userId: number): void {
    const isPlayer = game.players.some(player => player.id === userId);
    if (!isPlayer) {
      throw new ForbiddenException('User is not a player in this game');
    }
  }

  validateGameInVotingPhase(game: Game): void {
    if (game.status !== GameState.IN_PROGRESS || game.substate !== GameSubstate.VOTING) {
      throw new BadRequestException('Game is not in voting phase');
    }
  }

  async validatePlayerEligibleToVote(gameId: number, userId: number, round: number): Promise<void> {
    const playerResponse = await this.playerResponseRepository.findOne({
      where: {
        game: { id: gameId },
        player: { id: userId },
        round,
      },
    });

    if (!playerResponse || playerResponse.status !== ResponseStatus.SUBMITTED) {
      throw new ForbiddenException('Player must submit a response to be eligible to vote');
    }
  }

  async validateNoDuplicateVote(gameId: number, userId: number, round: number): Promise<void> {
    const existingVote = await this.playerVoteRepository.findOne({
      where: {
        game: { id: gameId },
        player: { id: userId },
        round,
      },
    });

    if (existingVote && existingVote.status === VoteStatus.VOTED) {
      throw new BadRequestException('Player has already voted for this round');
    }
  }

  validateVoteDeadline(votingDeadline: Date): void {
    const now = new Date();
    if (now > votingDeadline) {
      throw new BadRequestException('Voting deadline has passed');
    }
  }

  async validateAnswerExists(gameId: number, round: number, promptId: number, selectedAnswer: string): Promise<{ isCorrect: boolean; prompt: Prompt; playerResponse?: PlayerResponse }> {
    
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId, isActive: true },
    });

    if (prompt && selectedAnswer.toLowerCase().trim() === prompt.correctAnswer?.toLowerCase().trim()) {
      return { isCorrect: true, prompt: prompt };
    }

    
    const playerResponse = await this.playerResponseRepository.findOne({
      where: {
        game: { id: gameId },
        round,
        response: selectedAnswer,
        status: ResponseStatus.SUBMITTED,
      },
      relations: ['player'],
    });

    if (prompt && playerResponse) {
      return { isCorrect: false, prompt: prompt, playerResponse };
    }

    throw new BadRequestException('Selected answer does not exist in this round');
  }

  async validateNotVotingForOwnAnswer(gameId: number, userId: number, round: number, selectedAnswer: string): Promise<void> {
    const playerResponse = await this.playerResponseRepository.findOne({
      where: {
        game: { id: gameId },
        player: { id: userId },
        round,
        response: selectedAnswer,
      },
    });

    if (playerResponse) {
      throw new BadRequestException('Player cannot vote for their own answer');
    }
  }

  validateVoteCanBeUpdated(playerVote: PlayerVote): void {
    if (playerVote.status === VoteStatus.VOTED) {
      throw new BadRequestException('Cannot modify a submitted vote');
    }

    if (playerVote.status === VoteStatus.TIMED_OUT) {
      throw new BadRequestException('Cannot modify a timed out vote');
    }
  }

  validateUserOwnsVote(playerVote: PlayerVote, userId: number): void {
    if (playerVote.player.id !== userId) {
      throw new ForbiddenException('User does not own this vote');
    }
  }

  async validatePromptExists(promptId: number): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId, isActive: true },
    });

    if (!prompt) {
      throw new NotFoundException(`Prompt with ID ${promptId} not found`);
    }

    return prompt;
  }
}