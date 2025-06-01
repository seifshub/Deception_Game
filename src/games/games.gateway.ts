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
import { error } from 'console';

@UseFilters(WebSocketExceptionFilter)
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: 'games',
})
export class GamesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{

    private gamers = new Map<number, Socket>();
    private readonly logger = new Logger(GamesGateway.name);
    
    @WebSocketServer()
    server: Server;

    constructor(private readonly gamesService: GamesService,
        private readonly gameValidator : GameValidator
    ) {}

    async handleConnection(client: Socket) {

        const user = client.request[REQUEST_USER_KEY] as ActiveUserData;

        if(!user) {
            this.logger.error(`Unauthorized connection attempt by client: ${client.id}`);
            client.disconnect();
            return;
        }

        this.gamers.set(user.sub, client)
        this.logger.log(`User ${user.username} connected. Socket ID: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {

        const user = client.request[REQUEST_USER_KEY] as ActiveUserData;
        if (!user) {
            this.logger.error(`Unauthorized disconnection attempt by client: ${client.id}`);
            throw new WsException('Unauthorized: No user data found');
        }
        
        const game = await this.gamesService.retrieveCurrentGame(user.sub);
        if(!game){
            this.logger.warn(`User ${user.username} disconnected without being in a game. Socket ID: ${client.id}`);
            return;
        }
        this.gamesService.leaveGame(game.id, user.sub);
        // TODO: make it so that if the game is aborted all players are notified / disconnected
        this.gamers.delete(user.sub);
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @UseGuards(WsSessionGuard)
    @SubscribeMessage('joinGameRoom')
    async handleJoinGameRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() gameId: number,
        @WsActiveUser() user: ActiveUserData,
    ) {
        const roomName = `game:${gameId}`;
        try{
            const game = await this.gamesService.verifyGameExists(gameId);
            this.gameValidator.validateUserIsPlayer(game, user.sub)}
        catch (error) {
            this.logger.error(`User ${user.username} failed to join room ${roomName}: ${error.message}`);
            throw new WsException(`Failed to join game room: ${error.message}`);
        }
        
        client.join(roomName);
        this.logger.log(`User ${user.username} joined room ${roomName}`);
        
        // Notify other users in the room 
        client.to(roomName).emit('playerJoined', {
        username: user.username
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

        try{
            const game = await this.gamesService.verifyGameExists(gameId);
            this.gameValidator.validateUserIsPlayer(game, user.sub)}
        catch (error) {
            this.logger.error(`User ${user.username} failed to leave room ${roomName}: ${error.message}`);
            throw new WsException(`Failed to leave game room: ${error.message}`);
        }
        
        // Notify other users in the room
        client.to(roomName).emit('playerLeft', {
        userId: user.sub,
        username: user.username
        });
        
        this.logger.log(`User ${user.username} left room ${roomName}`);
        return { success: true };
    }

    // could be used for in-game chat if we implement it later on
    @UseGuards(WsSessionGuard)
    @SubscribeMessage('gameMessage')
    async handleGameMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { gameId: number, message: string },
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
        timestamp: new Date().toISOString()
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
        try{
            const updatedGame = await this.gamesService.startGame(gameId, user.sub);
            this.broadcastGameUpdate(gameId,"gameStarted", updatedGame);
            this.logger.log(`User ${user.username} started game ${gameId}`);

            const randomPlayer = updatedGame.players[Math.floor(Math.random() * updatedGame.players.length)];

            // TODO: send topic to the random player
            

            return { success: true };

        }
        catch (error){
            this.logger.error(`User ${user.username} failed to start game ${gameId}: ${error.message}`);
            throw new WsException(`Failed to start game: ${error.message}`);
        }
    }

    //helper function to broadcast game updates
    broadcastGameUpdate(gameId: number,event: string, data: any) {
        const roomName = `game:${gameId}`;
        this.server.to(roomName).emit(event, data);
    }


}
