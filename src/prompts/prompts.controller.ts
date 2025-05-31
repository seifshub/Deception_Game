import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dtos/createPrompt.dto';
import { Prompt } from './entities/prompt.entity';

@Controller('prompts')
export class PromptsController {
    constructor(private readonly promptsService: PromptsService) { }

    @Post()
    async createPrompt(@Body() createDto: CreatePromptDto): Promise<Prompt> {
        return this.promptsService.createPrompt(createDto);
    }

    @Get('random/:topicId')
    async getRandomPrompt(
        @Param('topicId', ParseIntPipe) topicId: number,
    ): Promise<Prompt> {
        return this.promptsService.getRandomPrompt(topicId);
    }

    @Get('random-multiple/:topicId')
    async getRandomPrompts(
        @Param('topicId', ParseIntPipe) topicId: number,
        @Query('count') count = 3,
    ): Promise<Prompt[]> {
        return this.promptsService.getRandomPrompts(topicId, Number(count));
    }

    @Get('validate/:promptId')
    async validateAnswer(
        @Param('promptId', ParseIntPipe) promptId: number,
        @Query('answer') userAnswer: string,
    ): Promise<{ isCorrect: boolean }> {
        const isCorrect = await this.promptsService.validatePromptCorrectAnswer(
            promptId,
            userAnswer,
        );
        return { isCorrect };
    }

    @Put('deactivate/:id')
    async deactivatePrompt(@Param('id', ParseIntPipe) id: number): Promise<Prompt> {
        return this.promptsService.deactivatePrompt(id);
    }

    @Put('activate/:id')
    async activatePrompt(@Param('id', ParseIntPipe) id: number): Promise<Prompt> {
        return this.promptsService.activatePrompt(id);
    }

    @Get('topic/:topicId')
    async findByTopic(@Param('topicId', ParseIntPipe) topicId: number): Promise<Prompt[]> {
        return this.promptsService.findByTopic(topicId);
    }

    @Delete(':id')
    async deletePrompt(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
        await this.promptsService.deletePrompt(id);
        return { message: `Prompt with ID ${id} deleted.` };
    }
}
