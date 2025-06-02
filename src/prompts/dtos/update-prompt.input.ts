import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreatePromptInput } from './create-prompt.input';

@InputType()
export class UpdatePromptInput extends PartialType(CreatePromptInput) {
  @Field(() => Number)
  id: number;
}
