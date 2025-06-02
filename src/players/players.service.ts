import { Injectable } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';
import { CreateAnswerDto } from 'src/answers/dtos/create-answer.dto';
import { AnswersService } from 'src/answers/answers.service';
import { Round } from 'src/rounds/entities/round.entity';
import { CreateVoteInput } from 'src/votes/dto/create-vote.input';
import { VotesService } from 'src/votes/votes.service';

@Injectable()
export class PlayersService extends GenericCrudService<
  Player,
  DeepPartial<Player>,
  DeepPartial<Player>
> {
  constructor(
    playerRepository: Repository<Player>,
    private readonly answerService: AnswersService, 
    private readonly voteService: VotesService,
) {
    super(playerRepository);
  }

  async createPlayerProfile(user: User): Promise<Player> {

    return this.create({
      user,
    });

  }

  async addPlayerScore(playerId: number, scoreToAdd: number): Promise<Player> {
    const player = await this.findOne(playerId)
    
    player.score += scoreToAdd;
    return this.update(playerId, player);
  }

  async addAnswerToPlayer(playerId: number, CreateAnswerDto : CreateAnswerDto, round : Round): Promise<Player> {
    const player = await this.findOne(playerId);
    const answer = await this.answerService.createAnswer(CreateAnswerDto, round);

    if (!player.answers) {
      player.answers = [];
    }

    player.answers.push(answer);
    return this.update(playerId, player);
  }

  async addVoteToPlayer(playerId : number, createVoteInput : CreateVoteInput, roundNumber : number): Promise<Player> {
    const player = await this.findOne(playerId);
    const vote = await this.voteService.createVote(createVoteInput, player, roundNumber);

    if (!player.votes) {
      player.votes = [];
    }

    player.votes.push(vote);
    return this.update(playerId, player);
  }

  
}
