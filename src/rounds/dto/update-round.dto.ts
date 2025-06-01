import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateRoundDto {
    @IsOptional()
    @IsBoolean()
    isCompleted?: boolean;
}
