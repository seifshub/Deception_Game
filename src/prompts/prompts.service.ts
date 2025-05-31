import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Prompt } from './entities/prompt.entity';
import { Repository } from 'typeorm';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { TopicsService } from 'src/topics/topics.service';

@Injectable()
export class PromptsService extends GenericCrudService<Prompt> {
    constructor(
        @InjectRepository(Prompt)
        private readonly promptRepository: Repository<Prompt>,
        private readonly topicService: TopicsService, 
    ) {
        super(promptRepository);
    }

    async getRandomPrompt(topicId: number): Promise<Prompt> {
        const prompt = await this.promptRepository
          .createQueryBuilder('prompt')
          .innerJoinAndSelect('prompt.topic', 'topic')
          .where('prompt.topicId = :topicId', { topicId })
          .andWhere('prompt.isActive = :promptIsActive', { promptIsActive: true })
          .andWhere('topic.isActive = :topicIsActive', { topicIsActive: true })
          .orderBy('RANDOM()')
          .limit(1)
          .getOne();
        
        if (!prompt) {
            throw new BadRequestException('No active prompts found for topic ${topicId}');
        }

        return prompt; 
    }
    

}
