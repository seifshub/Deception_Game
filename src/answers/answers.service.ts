import { Injectable } from "@nestjs/common";
import { GenericCrudService } from "src/common/services/generic.crud.service";
import { Answer } from "./answers.entity";
import { DeepPartial, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateAnswerDto } from "./dtos/create-answer.dto";
import { Round } from "src/rounds/entities/round.entity";



@Injectable()
export class AnswersService extends GenericCrudService<
  Answer,
  DeepPartial<Answer>,
  DeepPartial<Answer>
> {
  constructor(
    @InjectRepository(Answer)
    answerRepository: Repository<Answer>,
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
    
}
