import { Field, InputType } from "@nestjs/graphql";
import { MaxLength, MinLength } from "class-validator";

@InputType()
export class CreateAnswerDto {
    //add content
    @Field()
    @MaxLength(100, { message: 'Content must be less than 100 characters' })
    @MinLength(2, { message: 'Content must be at least 2 characters' })
    content: string;

}