import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompt } from './entities/prompt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt])],
  controllers: [PromptsController],
  providers: [PromptsService]
})
export class PromptsModule {}
