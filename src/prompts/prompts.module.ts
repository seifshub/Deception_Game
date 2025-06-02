import { Module } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompt } from './entities/prompt.entity';
import { TopicsModule } from 'src/topics/topics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt]), TopicsModule],
  providers: [PromptsService],
  exports: [PromptsService]
})
export class PromptsModule {}
