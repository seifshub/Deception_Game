import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { ActiveUserData } from '../auth/interfaces/active-user-data.interface';
import { GamesService } from './games.service';
import { WsSessionGuard } from 'src/auth/guards/ws-session.guard';
import { WsActiveUser } from 'src/auth/decorators/ws-active-user.decorator';
import { WebSocketExceptionFilter } from 'src/common/filters/websocket-exception.filter';
import { REQUEST_USER_KEY } from 'src/auth/decorators/keys';
import { GameValidator } from './validators/game.validator';
import { TopicsService } from 'src/topics/topics.service';
import { Game } from './entities/game.entity';
import { CreateAnswerDto } from 'src/answers/dtos/create-answer.dto';
import { GameSubstate } from './enums/game.substate.enum';
import { number } from 'joi';
import { CreateVoteInput } from 'src/votes/dto/create-vote.input';
import { GameState } from './enums/game.state.enum';

@UseFilters(WebSocketExceptionFilter)
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: 'games',
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private gamers = new Map<number, Socket>();
  private readonly logger = new Logger(GamesGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gamesService: GamesService,
    private readonly gameValidator: GameValidator,
    private readonly topicService: TopicsService,
  ) {}

  async handleConnection(client: Socket) {
    // Accept all connections without authentication
    this.logger.log(`New client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    // Try to get user data, but don't require it
    const user = client.request[REQUEST_USER_KEY] as ActiveUserData;
    
    if (user) {
      // If we have user data, handle the game state
      const game = await this.gamesService.retrieveCurrentGame(user.sub);
      if (game) {
        const updatedGame = await this.gamesService.leaveGame(game.id, user.sub);
        this.gamers.delete(user.sub);
        
        if(updatedGame.status === GameState.ABORTED) {
          this.logger.log(`Game ${updatedGame.id} was aborted. Notifying players.`);
          this.broadcastGameUpdate(updatedGame.id, 'gameAborted', {
            message: 'The game has been aborted.',
          });
          // disconnect all players from the game room
          const roomName = `game:${updatedGame.id}`;
          this.server.to(roomName).socketsLeave(roomName);
          this.logger.log(`All players disconnected from room ${roomName}`);
        }
      }
    }
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @WsActiveUser() user: ActiveUserData,
  ) {
    // Store the socket for the authenticated user
    this.gamers.set(user.sub, client);
    this.logger.log(`User ${user.username} authenticated. Socket ID: ${client.id}`);
    
    return { 
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.sub,
        username: user.username
      }
    };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('joinGameRoom')
  async handleJoinGameRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() gameId: number,
    @WsActiveUser() user: ActiveUserData,
  ) {
    const roomName = `game:${gameId}`;
    try {
      const game = await this.gamesService.verifyGameExists(gameId);
      this.gameValidator.validateUserIsPlayer(game, user.sub);
    } catch (error) {
      this.logger.error(
        `User ${user.username} failed to join room ${roomName}: ${error.message}`,
      );
      throw new WsException(`Failed to join game room: ${error.message}`);
    }

    client.join(roomName);
    this.logger.log(`User ${user.username} joined room ${roomName}`);

    // Notify other users in the room
    client.to(roomName).emit('playerJoined', {
      username: user.username,
    });

    return { success: true };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('leaveGameRoom')
  async handleLeaveGameRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() gameId: number,
    @WsActiveUser() user: ActiveUserData,
  ) {
    const roomName = `game:${gameId}`;
    client.leave(roomName);

    try {
      const game = await this.gamesService.verifyGameExists(gameId);
      this.gameValidator.validateUserIsPlayer(game, user.sub);
    } catch (error) {
      this.logger.error(
        `User ${user.username} failed to leave room ${roomName}: ${error.message}`,
      );
      throw new WsException(`Failed to leave game room: ${error.message}`);
    }

    // Notify other users in the room
    client.to(roomName).emit('playerLeft', {
      userId: user.sub,
      username: user.username,
    });

    this.logger.log(`User ${user.username} left room ${roomName}`);
    return { success: true };
  }

  // could be used for in-game chat if we implement it later on
  @UseGuards(WsSessionGuard)
  @SubscribeMessage('gameMessage')
  async handleGameMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: number; message: string },
    @WsActiveUser() user: ActiveUserData,
  ) {
    const { gameId, message } = payload;
    const roomName = `game:${gameId}`;

    const game = await this.gamesService.verifyGameExists(gameId);
    this.gameValidator.validateUserIsPlayer(game, user.sub);

    this.server.to(roomName).emit('gameMessage', {
      userId: user.sub,
      username: user.username,
      message,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('startGame')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() gameId: number,
    @WsActiveUser() user: ActiveUserData,
  ) {
    try {
      const updatedGame = await this.gamesService.startGame(gameId, user.sub);
      this.broadcastGameUpdate(gameId, 'gameStarted', updatedGame);
      this.logger.log(`User ${user.username} started game ${gameId}`);

      await this.choseTopic(updatedGame);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `User ${user.username} failed to start game ${gameId}: ${error.message}`,
      );
      throw new WsException(`Failed to start game: ${error.message}`);
    }
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('chooseTopic')
  async handleChooseTopic(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { gameId: number; topicId: number },
    @WsActiveUser() user: ActiveUserData,
  ) {
    try {
      const { gameId, topicId } = payload;
      const game = await this.gamesService.addRoundToGame(gameId, topicId);

      this.logger.log(
        `User ${user.username} chose topic ${topicId} for game ${gameId}`,
      );

      const currentRound = await this.gamesService.retrieveCurrentRound(game);
      const currentPrompt = currentRound.prompt;

      this.broadcastGameUpdate(gameId, 'answerPrompt', {
        roundId: currentRound.id,
        prompt: currentPrompt.promptContent,
      });
      return { success: true };
    } catch (error) {
      this.logger.error(
        `User ${user.username} failed to choose topic for game ${payload.gameId}: ${error.message}`,
      );
      throw new WsException(`Failed to choose topic: ${error.message}`);
    }
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { gameId: number; createAnswerDto: CreateAnswerDto },
    @WsActiveUser() user: ActiveUserData,
  ) {
    const { gameId, createAnswerDto } = payload;

    try {
      const game = await this.gamesService.verifyGameExists(gameId);
      this.gameValidator.validateUserIsPlayer(game, user.sub);

      const currentRound = await this.gamesService.retrieveCurrentRound(game);
      // don't allow user to guess the correct answer
      if (createAnswerDto.content === currentRound.prompt.correctAnswer) {
        const playerSocket = this.retrievePlayerSocket(user.sub);
        playerSocket.emit('answerCorrectChangeIt', {
          message:
            'You guessed the correct answer! Please change it to something else.',
        });
        return { success: false };
      }

      await this.gamesService.submitAnswer(
        user.sub,
        createAnswerDto,
        currentRound,
      );
      this.logger.log(
        `User ${user.username} submitted answer for game ${gameId}`,
      );

      this.broadcastGameUpdate(gameId, 'answerSubmitted', {
        userId: user.sub,
        username: user.username,
      });

      const updatedGame = await this.gamesService.verifyGameExists(gameId);

      //get answers for the current round
      const currentRoundAnswers = updatedGame.playerProfiles.flatMap((player) =>
        player.answers.filter((answer) => answer.round.id === currentRound.id),
      );

      if (currentRoundAnswers.length === updatedGame.playerProfiles.length) {
        this.logger.log(
          `All players have submitted answers for game ${gameId}`,
        );
        this.broadcastGameUpdate(gameId, 'allAnswersSubmitted', {
          roundId: currentRound.id,
          userAnswers: currentRoundAnswers.map((answer) => ({
            answerId: answer.id,
            content: answer.content,
          })),
          correctAnswerId: Number.MAX_SAFE_INTEGER, // to identify the correct answer later
          correctAnswer: currentRound.prompt.correctAnswer,
        });

        this.gamesService.switchSubstate(
          gameId,
          GameSubstate.GIVING_ANSWER,
          GameSubstate.VOTING,
        );
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `User ${user.username} failed to submit answer for game ${gameId}: ${error.message}`,
      );
      throw new WsException(`Failed to submit answer: ${error.message}`);
    }
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('submitVote')
  async handleSubmitVote(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { gameId: number; createVoteInput: CreateVoteInput },
    @WsActiveUser() user: ActiveUserData,
  ) {
    const { gameId, createVoteInput } = payload;

    try {
      const game = await this.gamesService.verifyGameExists(gameId);
      this.gameValidator.validateUserIsPlayer(game, user.sub);

      const currentRound = await this.gamesService.retrieveCurrentRound(game);

      await this.gamesService.submitVote(
        user.sub,
        createVoteInput,
        currentRound.roundNumber,
      );
      this.logger.log(
        `User ${user.username} submitted vote for game ${gameId}`,
      );

      this.broadcastGameUpdate(gameId, 'voteSubmitted', {
        userId: user.sub,
        username: user.username,
      });

      const updatedGame = await this.gamesService.verifyGameExists(gameId);

      //get votes for the current round
      const currentRoundVotes = updatedGame.playerProfiles.flatMap((player) =>
        player.votes.filter(
          (vote) => vote.roundNumber === currentRound.roundNumber,
        ),
      );

      if (currentRoundVotes.length === updatedGame.playerProfiles.length) {
        this.logger.log(`All players have submitted votes for game ${gameId}`);

        // retrieve votes while taking into account the correct answer which does not have an answerId
        this.broadcastGameUpdate(gameId, 'allVotesSubmitted', {
          roundId: currentRound.id,
          votes: currentRoundVotes.map((vote) => ({
            playerId: vote.player.id,
            answerId: !vote.isRight ? vote.answer.id : Number.MAX_SAFE_INTEGER, // use MAX_SAFE_INTEGER for correct answer
            answerOwnerId: !vote.isRight ? vote.answer.player.id : null, // null if it's the correct answer
          })),
        });

        this.gamesService.switchSubstate(
          gameId,
          GameSubstate.VOTING,
          GameSubstate.SHOWING_RESULTS,
        );

        // update user scores based on votes and answers
        const playerProfiles = updatedGame.playerProfiles;
        for (const playerProfile of playerProfiles) {
          const answer = playerProfile.answers.filter(
            (answer) => answer.round.roundNumber === currentRound.roundNumber,
          )[0];
          const vote = playerProfile.votes.filter(
            (vote) => vote.roundNumber === currentRound.roundNumber,
          );

          // for the found answer retrive the votes linked to it meaning other people chose this answer
          const othersVotes = await this.gamesService.getVotesForAnswer(
            answer.id,
          );

          let scoreToAdd = 0;

          scoreToAdd += othersVotes.length * 10; // Each vote is worth 10 points

          if (vote[0] && vote[0].isRight) {
            scoreToAdd += 20; // Correct answer bonus
          }

          // Update player's score
          await this.gamesService.addScoreToPlayer(playerProfile.id, scoreToAdd);
        }

        const finalUpdatedGame =
          await this.gamesService.verifyGameExists(gameId);

        // Notify all players about score changes
        this.broadcastGameUpdate(gameId, 'scoresUpdated', {
          playerScores: finalUpdatedGame.playerProfiles.map(
            (playerProfile) => ({
              username: playerProfile.user.username,
              score: playerProfile.score,
            }),
          ),
        });

        if (currentRound.roundNumber < finalUpdatedGame.totalRounds) {
          // If there are more rounds, choose a new topic
          await this.choseTopic(finalUpdatedGame);
        } else {
          // If it's the last round, end the game
          this.gamesService.switchState(
            gameId,
            GameState.IN_PROGRESS,
            GameState.FINAL_RESULTS,
          );
          this.broadcastGameUpdate(gameId, 'finalResults', {
            finalScores: finalUpdatedGame.playerProfiles.map(
              (playerProfile) => ({
                username: playerProfile.user.username,
                score: playerProfile.score,
              }),
            ),
          });
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `User ${user.username} failed to submit vote for game ${gameId}: ${error.message}`,
      );
      throw new WsException(`Failed to submit vote: ${error.message}`);
    }
  }

  //for for host to end the game
  @UseGuards(WsSessionGuard)
  @SubscribeMessage('endGame')
  async handleEndGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() gameId: number,
    @WsActiveUser() user: ActiveUserData,
  ) {
    try {
      const game = await this.gamesService.endGame(gameId, user.sub);
      this.logger.log(`User ${user.username} ended game ${gameId}`);

      this.broadcastGameUpdate(gameId, 'gameEnded', {
        message: 'The game has ended.',
      });

      // disconnect all players from the game room
      const roomName = `game:${gameId}`;
      this.server.to(roomName).socketsLeave(roomName);
      
      this.logger.log(`All players disconnected from room ${roomName}`);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `User ${user.username} failed to end game ${gameId}: ${error.message}`,
      );
      throw new WsException(`Failed to end game: ${error.message}`);
    }
  }

  //helper functions to broadcast game updates

  retrievePlayerSocket(userId: number): Socket {
    const socket = this.gamers.get(userId);
    if (!socket) {
      this.logger.warn(`No socket found for user ${userId}`);
      throw new WsException(`No socket found for player`);
    }
    return socket;
  }

  broadcastGameUpdate(gameId: number, event: string, data: any) {
    const roomName = `game:${gameId}`;
    this.server.to(roomName).emit(event, data);
  }

  broadcastGameUpdateExcludingOne(
    gameId: number,
    event: string,
    data: any,
    excludeUserId: number,
  ) {
    const roomName = `game:${gameId}`;
    const excludedUserSocket = this.retrievePlayerSocket(excludeUserId);
    this.server.to(roomName).except(excludedUserSocket.id).emit(event, data);
    this.logger.log(
      `Broadcasting event ${event} to room ${roomName} excluding user ${excludeUserId}`,
    );
  }

  async choseTopic(game: Game): Promise<void> {
    const randomPlayer =
      game.playerProfiles[
        Math.floor(Math.random() * game.playerProfiles.length)
      ];
    const randomPlayerSocket = this.retrievePlayerSocket(randomPlayer.user.id);

    const topics = await this.topicService.getRandomTopics(5);

    // Update the game substate to CHOOSING_TOPIC
    this.gamesService.switchSubstate(
      game.id,
      game.substate,
      GameSubstate.CHOOSING_TOPIC,
    );

    // Notify the chosen player to choose a topic
    randomPlayerSocket.emit('chooseTopic', {
      topics: topics,
    });

    this.broadcastGameUpdateExcludingOne(
      game.id,
      'PlayerIsChoosingTopic',
      {
        playerId: randomPlayer.user.id,
        username: randomPlayer.user.username,
      },
      randomPlayer.user.id,
    );
  }
}
