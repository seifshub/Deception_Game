import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { Topic } from './entities/topic.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTopicDto } from './dtos/createTopic.dto';


@Injectable()
export class TopicsService extends GenericCrudService<Topic> {
    constructor(
        @InjectRepository(Topic)
        private readonly topicRepository: Repository<Topic>,
    ) {
        super(topicRepository)
    }

    async createTopic(createTopicDto: CreateTopicDto): Promise<Topic> {
        const existingTopic = await this.topicRepository.findOne({
            where: { name: createTopicDto.name.trim() }
        })
        if (existingTopic) {
            throw new BadRequestException(`Topic with name "${createTopicDto.name}" already exists`);
        }

        const topic = this.topicRepository.create({
            name: createTopicDto.name.trim(),
            description: createTopicDto.description?.trim() || '',
            isActive: createTopicDto.isActive ?? true
        });

        return await this.topicRepository.save(topic);
    }

    async getRandomTopic(): Promise<Topic> {
        const topics = await this.getRandomTopics(1);
        const topic = topics[0];
        
        return topic;
    }

    async getRandomTopics(count: number = 3): Promise<Topic[]> {
        const topics = await this.topicRepository
            .createQueryBuilder('topic')
            .where('topic.isActive = :isActive', { isActive: true })
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

    async findActiveTopics(): Promise<Topic[]> {
        return await this.topicRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' }
        });
    }

    async findInactiveTopics(): Promise<Topic[]> {
        return await this.topicRepository.find({
            where: { isActive: false },
            order: { name: 'ASC' }
        });
    }

    async findById(id: number): Promise<Topic> {
        const topic = await this.topicRepository.findOne({
            where: { id },
            relations: ['prompts']
        });
        if (!topic) {
            throw new NotFoundException(`Topic with ID ${id} not found`);
        }
        return topic;
    }

    async activateTopic(id: number): Promise<Topic> {
        const topic = await this.findById(id);
        topic.isActive = true;
        return await this.topicRepository.save(topic);
    }

    async deactivateTopic(id: number): Promise<Topic> {
        const topic = await this.findById(id);
        topic.isActive = false;
        return await this.topicRepository.save(topic);
    }

    async getTopicsWithPromptCount(): Promise<any[]> {
        return await this.topicRepository
            .createQueryBuilder('topic')
            .leftJoinAndSelect('topic.prompts', 'prompt')
            .select([
                'topic.id',
                'topic.name',
                'topic.description',
                'topic.isActive',
                'COUNT(prompt.id) as promptCount'
            ])
            .groupBy('topic.id')
            .orderBy('topic.name', 'ASC')
            .getRawMany();
    }

    async countAllTopics(): Promise<number> {
        return await this.topicRepository.count();
    }

    async deleteWithValidation(id: number): Promise<void> {
        const topic = await this.topicRepository.findOne({
            where: { id },
            relations: ['prompts']
        });

        if (!topic) {
            throw new NotFoundException(`Topic with ID ${id} not found`);
        }

        if (topic.prompts && topic.prompts.length > 0) {
            throw new BadRequestException(
                `Cannot delete topic "${topic.name}" because it has ${topic.prompts.length} associated prompts`
            );
        }

        await this.topicRepository.remove(topic);
    }

}
