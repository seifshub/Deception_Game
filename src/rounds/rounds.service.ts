import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Round } from './entities/round.entity';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { Game } from 'src/games/entities/game.entity';
import { Prompt } from 'src/prompts/entities/prompt.entity';

@Injectable()
export class RoundsService extends GenericCrudService<
  Round,
  DeepPartial<Round>,
  DeepPartial<Round>
> {
  constructor(
    @InjectRepository(Round)
    roundRepository: Repository<Round>,
  ) {
    super(roundRepository);
  }
  
  async createRound(game: Game, prompt: Prompt, roundNumber: number ): Promise<Round> {
    
    const round = this.create({
      roundNumber,
      game,
      prompt,
    });

    return round;
  }

  async completeRound(id: number): Promise<Round> {
    
    return this.update(id, { isCompleted: true });
    
  }

}
