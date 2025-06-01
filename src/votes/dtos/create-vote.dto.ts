import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { InputType, Field, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';


@InputType()
export class CreatePlayerVoteDto {
  @Field(() => Int)
  @IsNumber()
  gameId: number;

  @Field(() => Int)
  @IsNumber()
  promptId: number;

  @Field(() => String)
  @IsString({ message: 'Selected answer must be a string' })
  @IsNotEmpty({ message: 'Selected answer cannot be empty' })
  @Transform(({ value }) => value?.trim())
  selectedAnswer: string;

  @Field(() => Int)
  @IsNumber({}, { message: 'Round must be a number' })
  round: number;
}