import { Test, TestingModule } from '@nestjs/testing';
import { PromptsService } from './prompts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Prompt } from './entities/prompt.entity';
import { TopicsService } from '../topics/topics.service';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPromptRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  })),
});

const mockTopicService = () => ({
  findById: jest.fn(),
});

describe('PromptsService', () => {
  let service: PromptsService;
  let repo: jest.Mocked<Repository<Prompt>>;
  let topicService: jest.Mocked<TopicsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptsService,
        { provide: getRepositoryToken(Prompt), useFactory: mockPromptRepository },
        { provide: TopicsService, useFactory: mockTopicService },
      ],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
    repo = module.get(getRepositoryToken(Prompt)) as jest.Mocked<Repository<Prompt>>;
    topicService = module.get(TopicsService) as jest.Mocked<TopicsService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPrompt', () => {
    it('should create and save a prompt', async () => {
      const createDto = {
        promptContent: 'What is the capital of France?',
        correctAnswer: 'Paris',
        topicId: 1,
        isActive: true,
      };

      const topic = { id: 1, name: 'Geography' } as any;
      const prompt = { ...createDto, topic } as any;

      topicService.findById.mockResolvedValue(topic);
      repo.create.mockReturnValue(prompt);
      repo.save.mockResolvedValue(prompt);

      const result = await service.createPrompt(createDto);
      expect(topicService.findById).toHaveBeenCalledWith(createDto.topicId);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(prompt);
      expect(result).toEqual(prompt);
    });
  });

  describe('deletePrompt', () => {
    it('should delete an existing prompt', async () => {
      const prompt = { id: 1 } as Prompt;
      repo.findOneBy.mockResolvedValue(prompt);
      await service.deletePrompt(1);
      expect(repo.remove).toHaveBeenCalledWith(prompt);
    });

    it('should throw if prompt not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.deletePrompt(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRandomPrompt', () => {
    it('should return a random prompt', async () => {
      const queryBuilder = repo.createQueryBuilder() as any;
      const prompt = { id: 1 } as Prompt;
      queryBuilder.getOne.mockResolvedValue(prompt);

      const result = await service.getRandomPrompt(1);
      expect(result).toEqual(prompt);
    });

    it('should throw if no prompt found', async () => {
      const queryBuilder = repo.createQueryBuilder() as any;
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.getRandomPrompt(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRandomPrompts', () => {
    it('should return multiple random prompts', async () => {
      const queryBuilder = repo.createQueryBuilder() as any;
      const prompts = [{ id: 1 }, { id: 2 }, { id: 3 }] as Prompt[];
      queryBuilder.getMany.mockResolvedValue(prompts);

      const result = await service.getRandomPrompts(1, 3);
      expect(result).toEqual(prompts);
    });

    it('should throw if not enough prompts found', async () => {
      const queryBuilder = repo.createQueryBuilder() as any;
      queryBuilder.getMany.mockResolvedValue([{ id: 1 }]);

      await expect(service.getRandomPrompts(1, 3)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validatePromptCorrectAnswer', () => {
    it('should return true for correct answer', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 1,
        correctAnswer: 'Paris',
      } as Prompt);

      const isValid = await service.validatePromptCorrectAnswer(1, '  paris ');
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect answer', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 1,
        correctAnswer: 'Paris',
      } as Prompt);

      const isValid = await service.validatePromptCorrectAnswer(1, 'London');
      expect(isValid).toBe(false);
    });

    it('should throw if prompt not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.validatePromptCorrectAnswer(1, 'Paris')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivatePrompt', () => {
    it('should deactivate an existing prompt', async () => {
      const prompt = { id: 1, isActive: true } as Prompt;
      repo.findOneBy.mockResolvedValue(prompt);
      repo.save.mockResolvedValue({ ...prompt, isActive: false });

      const result = await service.deactivatePrompt(1);
      expect(result.isActive).toBe(false);
    });

    it('should throw if prompt not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.deactivatePrompt(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTopic', () => {
    it('should return prompts for a topic', async () => {
      const prompts = [{ id: 1 }, { id: 2 }] as Prompt[];
      repo.find.mockResolvedValue(prompts);

      const result = await service.findByTopic(1);
      expect(result).toEqual(prompts);
    });
  });
});
