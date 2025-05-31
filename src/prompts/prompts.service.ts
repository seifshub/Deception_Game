import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Prompt } from './entities/prompt.entity';
import { Repository } from 'typeorm';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { TopicsService } from '../topics/topics.service';
import { CreatePromptDto } from './dtos/createPrompt.dto';

@Injectable()
export class PromptsService extends GenericCrudService<Prompt> {
    constructor(
        @InjectRepository(Prompt)
        private readonly promptRepository: Repository<Prompt>,
        private readonly topicService: TopicsService,
    ) {
        super(promptRepository);
    }

    async createPrompt(createDto: CreatePromptDto): Promise<Prompt> {
        const topic = await this.topicService.findById(createDto.topicId);

        const prompt = this.promptRepository.create({
            promptContent: createDto.promptContent.trim(),
            correctAnswer: createDto.correctAnswer.trim(),
            topic,
            isActive: createDto.isActive ?? true,
        });

        return await this.promptRepository.save(prompt);
    }

    async deletePrompt(id: number): Promise<void> {
        const prompt = await this.promptRepository.findOneBy({ id });
        if (!prompt) throw new NotFoundException(`Prompt with ID ${id} not found`);
        await this.promptRepository.remove(prompt);
    }


    async findByTopic(topicId: number): Promise<Prompt[]> {
        return await this.promptRepository.find({
            where: { topic: { id: topicId } },
            relations: ['topic'],
            order: { promptContent: 'ASC' },
        });
    }

    async deactivatePrompt(id: number): Promise<Prompt> {
        const prompt = await this.promptRepository.findOneBy({ id });
        if (!prompt) throw new NotFoundException(`Prompt with ID ${id} not found`);
        prompt.isActive = false;
        return await this.promptRepository.save(prompt);
    }

    async activatePrompt(id: number): Promise<Prompt> {
        const prompt = await this.promptRepository.findOneBy({ id });
        if (!prompt) throw new NotFoundException(`Prompt with ID ${id} not found`);
        prompt.isActive = true;
        return await this.promptRepository.save(prompt);
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
            throw new BadRequestException(`No active prompts found for topic ${topicId}`);
        }

        return prompt;
    }

    async getRandomPrompts(topicId: number, count = 3): Promise<Prompt[]> {
        const prompts = await this.promptRepository
            .createQueryBuilder('prompt')
            .innerJoinAndSelect('prompt.topic', 'topic')
            .where('prompt.topicId = :topicId', { topicId })
            .andWhere('prompt.isActive = :promptIsActive', { promptIsActive: true })
            .andWhere('topic.isActive = :topicIsActive', { topicIsActive: true })
            .orderBy('RANDOM()')
            .limit(count)
            .getMany();

        if (!prompts || prompts.length < count) {
            throw new BadRequestException(`Only ${prompts?.length?? 0} prompts found for topic ${topicId}, requested ${count}`);
        }

        return prompts;
    }

    async validatePromptCorrectAnswer(promptId: number, userAnswer: string): Promise<boolean> {
        const prompt = await this.promptRepository.findOneBy({ id: promptId });
        if (!prompt) throw new NotFoundException(`Prompt with ID ${promptId} not found`);

        return prompt.correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
    }




}
