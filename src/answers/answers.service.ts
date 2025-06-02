import { Injectable } from "@nestjs/common";
import { GenericCrudService } from "src/common/services/generic.crud.service";
import { Answer } from "./answers.entity";
import { DeepPartial, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateAnswerDto } from "./dtos/create-answer.dto";
import { Round } from "src/rounds/entities/round.entity";
import { Vote } from "src/votes/entities/vote.entity";



@Injectable()
export class AnswersService extends GenericCrudService<
  Answer,
  DeepPartial<Answer>,
  DeepPartial<Answer>
> {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {
    super(answerRepository);
  }
  async createAnswer( createAnswerDto : CreateAnswerDto, round : Round): Promise<Answer> {
    const answer = this.create({
      ...createAnswerDto,
        round,
    });

    return answer;
  }

  async getVotesForAnswer(answerId: number): Promise<Vote[]> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['votes', 'votes.player']
    });
    
    if (!answer) {
      return [];
    }
    
    return answer.votes;
  }

}
