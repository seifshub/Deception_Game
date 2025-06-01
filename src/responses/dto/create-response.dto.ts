import { IsString, IsNotEmpty, IsNumber, MaxLength, MinLength } from 'class-validator';
import { InputType, Field, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

@InputType()
export class CreatePlayerResponseDto {
  @Field(() => Int)
  @IsNumber()
  gameId: number;

  @Field(() => Int)
  @IsNumber()
  promptId: number;

  @Field(() => String, { description: 'Fake answer response' })
  @IsString({ message: 'Response must be a string' })
  @IsNotEmpty({ message: 'Response cannot be empty' })
  @MinLength(1, { message: 'Response must have at least 1 character' })
  @MaxLength(200, { message: 'Response cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  response: string;

  @Field(() => Int)
  @IsNumber()
  round: number;
}