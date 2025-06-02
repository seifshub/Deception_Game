import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateTopicInput {
    @Field()
    @IsString()
    @MinLength(2, { message: 'Topic name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Topic name cannot exceed 100 characters' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    name: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    description?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}