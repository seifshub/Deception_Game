import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { Visibility } from '../enums/game.visibilty.enum';

@InputType()
export class CreateGameInput {
    @Field()
    @IsNotEmpty()
    name: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    size?: number;

    @Field(() => Visibility, { nullable: true })
    @IsOptional()
    @IsEnum(Visibility)
    visibility?: Visibility;

    @Field({ nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    rounds?: number;
}
