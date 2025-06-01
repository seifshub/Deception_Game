import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

export class BaseValidator {
  async validateEntityExists<T>(repo: Repository<T>, id: number, entityName: string): Promise<T> {
    const entity = await repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`${entityName} with ID ${id} not found`);
    }
    return entity;
  }

  validateUserIsInCollection(
    collection: { id: number }[],
    userId: number,
    message = 'User is not authorized'
  ): void {
    const isPresent = collection.some(item => item.id === userId);
    if (!isPresent) {
      throw new ForbiddenException(message);
    }
  }

  validateLength(text: string, maxLength: number, emptyMessage = 'Text cannot be empty', tooLongMessage?: string): void {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException(emptyMessage);
    }
    if (text.length > maxLength) {
      throw new BadRequestException(tooLongMessage || `Text cannot exceed ${maxLength} characters`);
    }
  }

  validateDateNotPast(date: Date, message = 'Deadline has passed'): void {
    if (new Date() > date) {
      throw new BadRequestException(message);
    }
  }

  validateOwnership(entityOwnerId: number, userId: number, message = 'User does not own this resource'): void {
    if (entityOwnerId !== userId) {
      throw new ForbiddenException(message);
    }
  }
}