import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { User } from '../users/entities/user.entity';
import { GameState } from './enums/game.state.enum';

@Injectable()
export class GamesService extends GenericCrudService<
  Game,
  CreateGameInput,
  UpdateGameInput
> {
  constructor(
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    super(gameRepository);
  }

  async createGameWithHost(createGameInput: CreateGameInput, hostId: number): Promise<Game> {
    const host = await this.userRepository.findOneOrFail({ where: { id: hostId } });
    
    const game = this.gameRepository.create({
      ...createGameInput,
      host,
      players: [host], 
    });
    game.current_size = 1; 
    
    return this.gameRepository.save(game);
  }

  async joinGame(gameId: number, userId: number): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['players'],
    });
    
    if (!game) {
        throw new NotFoundException(`Game with id ${gameId} not found`);
    }
    else if (game.status !== GameState.PREPARING) {
        throw new ForbiddenException(`Game with id ${gameId} is not in a joinable state`);
    }
    
    const user = await this.userRepository.findOneOrFail({ where: { id: userId } });

    if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (game.players.some(player => player.id === userId)) {
        throw new ForbiddenException(`User with id ${userId} is already in the game`);
    }
    if (game.current_size >= game.size) {
        throw new ForbiddenException(`Game with id ${gameId} is full`);
    }
    // TODO: add check for game visibility and user friendship

    game.players.push(user);
      game.current_size += 1;
      return this.gameRepository.save(game);
  }

  async updateGame(
    gameId: number,
    updateGameInput: UpdateGameInput,
    userId: number
  ): Promise<Game> {
    const game = await this.gameRepository.findOneOrFail({ where: { id: gameId } });

    // TODO: make it so that checks happen in before update hook
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }
    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }
    if(game.host.id !== userId) {
        throw new ForbiddenException(`User with id ${userId} is not the host of the game`);
    }

    Object.assign(game, updateGameInput);
    
    return this.gameRepository.save(game);
  }
}