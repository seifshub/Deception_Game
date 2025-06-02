import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Topic } from './entities/topic.entity';
import { Repository } from 'typeorm';
import { CreateTopicDto } from './dtos/create-topic.input';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TopicsService', () => {
  let service: TopicsService;
  let repository: jest.Mocked<Repository<Topic>>;

  const mockTopicRepository = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  });

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        {
          provide: getRepositoryToken(Topic),
          useFactory: mockTopicRepository,
        },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
    repository = module.get(getRepositoryToken(Topic));
  });

  describe('createTopic', () => {
    it('should create a new topic successfully', async () => {
      const dto: CreateTopicDto = {
        name: 'Science',
        description: 'Fun facts',
        isActive: true,
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(dto as any);
      repository.save.mockResolvedValue(dto as any);

      const result = await service.createTopic(dto);
      expect(result).toEqual(dto);
      expect(repository.create).toHaveBeenCalledWith({
        name: dto.name.trim(),
        description: dto.description ? dto.description.trim() : '',
        isActive: dto.isActive,
      });
      expect(repository.save).toHaveBeenCalledWith(dto);
    });

    it('should throw an error if topic already exists', async () => {
      const dto: CreateTopicDto = {
        name: 'Science',
        description: 'Fun facts',
        isActive: true,
      };

      repository.findOne.mockResolvedValue(dto as any);

      await expect(service.createTopic(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getRandomTopic', () => {
    it('should return a random active topic', async () => {
      const topic = { id: 1, name: 'Math', isActive: true };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockQueryBuilder.getOne.mockResolvedValue(topic);

      const result = await service.getRandomTopic();
      expect(result).toEqual(topic);
    });

    it('should throw an error if no active topics found', async () => {
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.getRandomTopic()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getRandomTopics', () => {
    it('should return the requested number of random topics', async () => {
      const topics = [
        { id: 1, name: 'Math', isActive: true },
        { id: 2, name: 'Science', isActive: true },
        { id: 3, name: 'History', isActive: true },
      ];
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockQueryBuilder.getMany.mockResolvedValue(topics);

      const result = await service.getRandomTopics(3);
      expect(result).toEqual(topics);
    });

    it('should throw an error if not enough topics found', async () => {
      const topics = [{ id: 1, name: 'Math', isActive: true }];
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockQueryBuilder.getMany.mockResolvedValue(topics);

      await expect(service.getRandomTopics(3)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findActiveTopics', () => {
    it('should return all active topics', async () => {
      const topics: Partial<Topic>[] = [
        { id: 1, name: 'Math', isActive: true },
        { id: 2, name: 'Science', isActive: true },
      ];
      repository.find.mockResolvedValue(topics as Topic[]);

      const result = await service.findActiveTopics();
      expect(result).toEqual(topics);
    });
  });

  describe('findInactiveTopics', () => {
    it('should return all inactive topics', async () => {
      const topics: Partial<Topic>[] = [
        { id: 1, name: 'Math', isActive: false },
        { id: 2, name: 'Science', isActive: false },
      ];
      repository.find.mockResolvedValue(topics as Topic[]);

      const result = await service.findInactiveTopics();
      expect(result).toEqual(topics);
    });
  });

  describe('findById', () => {
    it('should return the topic with the given ID', async () => {
      const topic = { id: 1, name: 'Math', isActive: true, prompts: [] };
      repository.findOne.mockResolvedValue(topic as any);

      const result = await service.findById(1);
      expect(result).toEqual(topic);
    });

    it('should throw an error if topic not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateTopic', () => {
    it('should activate the topic', async () => {
      const topic = { id: 1, name: 'Math', isActive: false };
      jest.spyOn(service, 'findById').mockResolvedValue(topic as any);
      repository.save.mockResolvedValue({ ...topic, isActive: true } as any);

      const result = await service.activateTopic(1);
      expect(result.isActive).toBe(true);
    });
  });

  describe('deactivateTopic', () => {
    it('should deactivate the topic', async () => {
      const topic = { id: 1, name: 'Math', isActive: true };
      jest.spyOn(service, 'findById').mockResolvedValue(topic as any);
      repository.save.mockResolvedValue({ ...topic, isActive: false } as any);

      const result = await service.deactivateTopic(1);
      expect(result.isActive).toBe(false);
    });
  });

  describe('getTopicsWithPromptCount', () => {
    it('should return topics with prompt counts', async () => {
      const topics = [
        {
          id: 1,
          name: 'Math',
          description: 'Numbers',
          isActive: true,
          promptCount: 5,
        },
        {
          id: 2,
          name: 'Science',
          description: 'Experiments',
          isActive: true,
          promptCount: 3,
        },
      ];
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockQueryBuilder.getRawMany.mockResolvedValue(topics);

      const result = await service.getTopicsWithPromptCount();
      expect(result).toEqual(topics);
    });
  });

  describe('deleteWithValidation', () => {
    it('should delete the topic if no prompts are associated', async () => {
      const topic = { id: 1, name: 'Math', prompts: [] };
      repository.findOne.mockResolvedValue(topic as any);
      repository.remove.mockResolvedValue(undefined as any);

      await service.deleteWithValidation(1);
      expect(repository.remove).toHaveBeenCalledWith(topic);
    });

    it('should throw an error if topic has associated prompts', async () => {
      const topic = { id: 1, name: 'Math', prompts: [{}] };
      repository.findOne.mockResolvedValue(topic as any);

      await expect(service.deleteWithValidation(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw an error if topic not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteWithValidation(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
