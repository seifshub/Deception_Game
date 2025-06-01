import { VoteStatus, VoteType } from '../enums';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PlayerVote } from '../entities/votes.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerResponse } from '../../responses/entities/response.entity';
import { Game } from '../../games/entities/game.entity';
import { User } from '../../users/entities/user.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { Repository } from 'typeorm';

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
      relations: ['player', 'game', 'question', 'voted_response'],
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
    // Check if player submitted a response for this round
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

  async validateAnswerExists(gameId: number, round: number, selectedAnswer: string): Promise<{ isCorrect: boolean; playerResponse?: PlayerResponse }> {
    // First check if it's the correct answer (you'll need to implement this based on your Question entity)
    const prompt = await this.promptRepository.findOne({
      where: { 
        // Add your question lookup logic here based on game and round
      }
    });

    if (prompt && selectedAnswer.toLowerCase().trim() === prompt.correct_answer?.toLowerCase().trim()) {
      return { isCorrect: true };
    }

    // Check if it's a player's fake answer
    const playerResponse = await this.playerResponseRepository.findOne({
      where: {
        game: { id: gameId },
        round,
        response: selectedAnswer,
        status: ResponseStatus.SUBMITTED,
      },
      relations: ['player'],
    });

    if (playerResponse) {
      return { isCorrect: false, playerResponse };
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
}