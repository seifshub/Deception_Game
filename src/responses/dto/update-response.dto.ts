import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

@InputType()
export class UpdatePlayerResponseDto {
  @Field(() => String, { description: 'Updated fake answer response' })
  @IsString({ message: 'Response must be a string' })
  @IsNotEmpty({ message: 'Response cannot be empty' })
  @MinLength(1, { message: 'Response must have at least 1 character' })
  @MaxLength(200, { message: 'Response cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  response: string;
}