import { IsInt, IsOptional } from 'class-validator';

export class CreateRoundDto {
    @IsOptional()
    @IsInt({ message: 'Prompt ID must be an integer' })
    promptId?: number;
}
