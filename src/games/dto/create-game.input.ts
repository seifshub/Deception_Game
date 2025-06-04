import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsInt, Min, IsOptional, IsEnum, Max } from 'class-validator';
import { Visibility } from '../enums/game.visibilty.enum';

@InputType()
export class CreateGameInput {
    @Field()
    @IsNotEmpty()
    name: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsInt()
    @Max(10)
    @Min(1)
    size?: number;

    @Field(() => Visibility, { nullable: true })
    @IsOptional()
    @IsEnum(Visibility)
    visibility?: Visibility;

    @Field({ nullable: true })
    @IsOptional()
    @IsInt()
    @Max(10)
    @Min(1)
    rounds?: number;
}
