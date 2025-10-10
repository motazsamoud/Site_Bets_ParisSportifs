import {
    WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OddsService } from './odds.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ namespace: '/ws/odds', cors: { origin: '*' } })
export class OddsGateway {
    @WebSocketServer() server: Server;

    private timers = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly odds: OddsService,
        private readonly config: ConfigService,
    ) {}

    @SubscribeMessage('subscribe')
    async handleSubscribe(
        @MessageBody() body: { sportKey: string; regions?: string; markets?: string; intervalMs?: number },
        @ConnectedSocket() client: Socket,
    ) {
        const key = client.id;
        const interval = Math.max(1000, Number(body?.intervalMs || this.config.get('ODDS_RT_POLL_MS', 3000)));

        // Nettoie ancien timer si existant
        const old = this.timers.get(key);
        if (old) clearInterval(old);

        // Premier push immédiat
        await this.pushOnce(client, body);

        // Puis polling périodique
        const t = setInterval(() => this.pushOnce(client, body), interval);
        this.timers.set(key, t);

        client.emit('subscribed', { ok: true, intervalMs: interval });
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(@ConnectedSocket() client: Socket) {
        const t = this.timers.get(client.id);
        if (t) clearInterval(t);
        this.timers.delete(client.id);
        client.emit('unsubscribed', { ok: true });
    }

    async pushOnce(client: Socket, body: { sportKey: string; regions?: string; markets?: string }) {
        try {
            const data = await this.odds.getOddsForSport(body.sportKey, {
                regions: body.regions,
                markets: body.markets,
                limitEvents: 8,
            });
            client.emit('odds:update', data);
        } catch (e) {
            client.emit('odds:error', { message: 'fetch_failed' });
        }
    }

    handleDisconnect(client: Socket) {
        const t = this.timers.get(client.id);
        if (t) clearInterval(t);
        this.timers.delete(client.id);
    }
}
