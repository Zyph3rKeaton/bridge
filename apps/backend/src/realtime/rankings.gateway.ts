import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/ws' })
export class RankingsGateway implements OnModuleInit {
  @WebSocketServer()
  server!: Server;

  onModuleInit() {}

  emitRankings(eventId: string, payload: any) {
    this.server.to(`event:${eventId}:rankings`).emit('rankings', payload);
  }
} 