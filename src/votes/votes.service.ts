import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { CreateVoteInput } from './dto/create-vote.input';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { Player } from '../players/entities/player.entity';
import { AnswersService } from 'src/answers/answers.service';

@Injectable()
export class VotesService extends GenericCrudService<
  Vote,
  DeepPartial<Vote>,
  DeepPartial<Vote>
> {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    private readonly answerService: AnswersService,
  ) {
    super(voteRepository);
  }

  async createVote(
    createVoteInput: CreateVoteInput,
    player: Player,
    roundNumber: number,
  ): Promise<Vote> {
    const { answerId } = createVoteInput;
    if (answerId < Number.MAX_SAFE_INTEGER) {
      const answer = await this;
      this.answerService.findOne(answerId);
      return this.create({
        ...createVoteInput,
        player,
        answer,
        roundNumber,
      } as DeepPartial<Vote>);
    } else {
      return this.create({
        ...createVoteInput,
        player,
        roundNumber,
        isRight: true,
      } as DeepPartial<Vote>);
    }
  }

  async findVotesByPlayer(playerId: number): Promise<Vote[]> {
    return this.voteRepository.find({
      where: { player: { id: playerId } },
      relations: ['answer'],
    });
  }

  async findVotesByAnswer(answerId: number): Promise<Vote[]> {
    return this.voteRepository.find({
      where: { answer: { id: answerId } },
      relations: ['player'],
    });
  }

  async findVotesByRound(roundNumber: number): Promise<Vote[]> {
    return this.voteRepository.find({
      where: { roundNumber },
      relations: ['player', 'answer'],
    });
  }
}
