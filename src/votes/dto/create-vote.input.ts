import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateVoteInput {

  @Field(() => Int)
  answerId: number;

}
