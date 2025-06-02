import { Injectable } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';

@Injectable()
export class PlayersService extends GenericCrudService<
  Player,
  DeepPartial<Player>,
  DeepPartial<Player>
> {
  constructor(
    playerRepository: Repository<Player>,
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

  
}
