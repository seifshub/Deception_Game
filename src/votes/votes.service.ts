import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlayerVoteDto } from './dtos/create-vote.dto';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { PlayerVote } from './entities/votes.entity';
import { PlayerVoteValidator } from './validators/vote.validator';
import { PlayerResponseService } from '../responses/responses.service';
import { VoteStatus, VoteType } from './enums';
import { CORRECT_ANSWER_POINTS, FAKE_ANSWER_POINTS } from './votes.constants';


@Injectable()
export class PlayerVoteService {
  constructor(
    @InjectRepository(PlayerVote)
    private readonly playerVoteRepository: Repository<PlayerVote>,
    private readonly playerVoteValidator: PlayerVoteValidator,
    private readonly playerResponseService: PlayerResponseService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }

  async createVote(createDto: CreatePlayerVoteDto, userId: number): Promise<PlayerVote> {
    const { gameId, promptId, selectedAnswer, roundId } = createDto;

    return await this.dataSource.transaction(async (manager) => {
      // Validation & Fetching
      const game = await this.playerVoteValidator.validateGameExists(gameId);
      const user = await this.playerVoteValidator.validateUserExists(userId);
      const round = await this.playerVoteValidator.validateRoundExists(roundId);

      this.playerVoteValidator.validateUserIsPlayer(game, userId);
      this.playerVoteValidator.validateGameInVotingPhase(game);
      await this.playerVoteValidator.validatePlayerEligibleToVote(gameId, userId, roundId);
      await this.playerVoteValidator.validateNoDuplicateVote(gameId, userId, roundId);
      await this.playerVoteValidator.validateNotVotingForOwnAnswer(gameId, userId, roundId, selectedAnswer);

      const { isCorrect, prompt, playerResponse } =
        await this.playerVoteValidator.validateAnswerExists(gameId, roundId, promptId, selectedAnswer);

      // Create and save vote
      const vote = this.playerVoteRepository.create({
        status: VoteStatus.VOTED,
        voteType: isCorrect ? VoteType.CORRECT_ANSWER : VoteType.FAKE_ANSWER,
        selectedAnswer,
        votedAt: new Date(),
        points: isCorrect ? CORRECT_ANSWER_POINTS : 0,
        player: user,
        game,
        prompt,
        round,
        votedResponse: playerResponse ?? undefined,
      });

      const savedVote = await manager.save(vote);

      if (playerResponse) {
        playerResponse.points += FAKE_ANSWER_POINTS;
        await manager.save(playerResponse);
      }

      return savedVote;
    });
  }

  async getVotesByGameAndRound(gameId: number, roundId: number): Promise<PlayerVote[]> {
    return this.playerVoteRepository.find({
      where: {
        game: { id: gameId },
        round: { id: roundId },
        status: VoteStatus.VOTED,
      },
      relations: ['player', 'votedResponse'],
    });
  }

  async getPlayerVote(gameId: number, userId: number, roundId: number): Promise<PlayerVote | null> {
    return this.playerVoteRepository.findOne({
      where: {
        game: { id: gameId },
        player: { id: userId },
        round: { id: roundId },
      },
      relations: ['player', 'game', 'prompt', 'votedResponse'],
    });
  }

  async markVoteAsTimedOut(gameId: number, userId: number, roundId: number): Promise<PlayerVote> {
    let vote = await this.getPlayerVote(gameId, userId, roundId);

    if (!vote) {
      throw new NotFoundException('Vote not found');
    } else {
      vote.status = VoteStatus.TIMED_OUT;
    }

    return this.playerVoteRepository.save(vote);
  }

  async getVotesCount(gameId: number, roundId: number): Promise<number> {
    return this.playerVoteRepository.count({
      where: {
        game: { id: gameId },
        round: { id: roundId },
        status: VoteStatus.VOTED,
      },
    });
  }

  async calculateRoundScores(gameId: number, roundId: number): Promise<{ userId: number; points: number }[]> {
    const votes = await this.getVotesByGameAndRound(gameId, roundId);
    const responses = await this.playerResponseService.getResponsesByGameAndRound(gameId, roundId);

    const scores = new Map<number, number>();

    // Points for correct votes
    votes.forEach(vote => {
      if (vote.voteType === VoteType.CORRECT_ANSWER) {
        scores.set(vote.player.id, (scores.get(vote.player.id) || 0) + vote.points);
      }
    });

    // Points for fooling others (already updated in responses)
    responses.forEach(response => {
      scores.set(response.player.id, (scores.get(response.player.id) || 0) + response.points);
    });

    return Array.from(scores.entries()).map(([userId, points]): { userId: number, points: number } => ({ userId, points }));
  }
}