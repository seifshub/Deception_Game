import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { GameState } from '../enums/game.state.enum';
import { GameSubstate } from '../enums/game.substate.enum';
import { CreateGameInput } from './create-game.input';

@InputType()
export class UpdateGameInput extends PartialType(CreateGameInput) {
  @Field(() => GameState, { nullable: true })
  @IsOptional()
  @IsEnum(GameState)
  status?: GameState;

  @Field(() => GameSubstate, { nullable: true })
  @IsOptional()
  @IsEnum(GameSubstate)
  substate?: GameSubstate;
}
