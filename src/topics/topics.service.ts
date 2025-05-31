import { BadRequestException, Injectable } from '@nestjs/common';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { Topic } from './entities/topic.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class TopicsService extends GenericCrudService<Topic>
{
    constructor(
        @InjectRepository(Topic)
        private readonly topicRepository: Repository<Topic>,
    ) 
    {
        super(topicRepository)
    }

    async getRandomTopic(): Promise<Topic> {
        const topic = await this.topicRepository
          .createQueryBuilder('topic')
          .where('topic.isActive = :isActive', { isActive: true})
          .orderBy('RANDOM()')
          .limit(1)
          .getOne();
        if (!topic) {
            throw new BadRequestException('No active topics found');
        }
        return topic;
    }

    async getRandomTopics(count: number = 3): Promise<Topic[]> {
        const topics = await this.topicRepository
          .createQueryBuilder('topic')
          .where('topic.isActive = :isActive', { isActive: true})
          .orderBy('RANDOM()')
          .limit(count)
          .getMany();
        if (topics.length < count) {
            throw new BadRequestException(
                `Only ${topics.length} topics available, requested ${count}`,
                );
        }
        return topics;
    }

}
