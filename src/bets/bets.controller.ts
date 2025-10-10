import {Body, Controller, Get, Headers, Post, BadRequestException, Param, Put} from '@nestjs/common';
import {BetsService} from "src/bets/bets.service";

type PlaceBetBody = {
    stake: number; // en unités (ex: 50.25)
    selections: Array<{
        fixtureId: string;
        market: string;
        selection: string; // "home" | "draw" | "away"...
        price: number | string;
        event?: string;
        bookmaker?: string;
    }>;
};

@Controller('api/bets')
export class BetsController {
    constructor(private readonly svc: BetsService) {}

    private resolveUserId(h: Record<string, string | undefined>) {
        return h['x-user-id'] || 'demo-user';
    }

    @Get()
    async list(@Headers() headers: any) {
        const userId = this.resolveUserId(headers);
        return this.svc.listBets(userId);
    }
// bets.controller.ts
    @Put(':id')
    async updateBet(@Param('id') id: string, @Body() body: any) {
        return this.svc.updateBet(id, body);
    }


    @Post()
    async place(@Headers() headers: any, @Body() body: PlaceBetBody) {
        const userId = this.resolveUserId(headers);

        if (!body || !Array.isArray(body.selections)) {
            throw new BadRequestException('Payload invalide');
        }

        return this.svc.placeBet(userId, body);
    }
    @Get('history/:userId')
    async getHistory(@Param('userId') userId: string) {
        return this.svc.getUserHistory(userId);
    }

}
