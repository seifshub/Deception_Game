import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreatePromptDto {
    
    @Field()
    @IsString()
    @IsNotEmpty({ message: 'Prompt content must not be empty' })
    promptContent: string;

    @Field()
    @IsString()
    @IsNotEmpty({ message: 'Correct answer must not be empty' })
    correctAnswer: string;

    @Field(() => Int)
    @IsInt({ message: 'Topic ID must be an integer' })
    topicId: number;

    @Field({ defaultValue: true, nullable: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
