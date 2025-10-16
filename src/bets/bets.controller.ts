import {
    Body,
    Controller,
    Get,
    Headers,
    Post,
    BadRequestException,
    Param,
    Put,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { BetsService } from './bets.service';
import { JwtService } from '@nestjs/jwt';

type PlaceBetBody = {
    stake: number;
    selections: Array<{
        fixtureId: string;
        market: string;
        selection: string; // "home" | "draw" | "away"
        price: number | string;
        event?: string;
        bookmaker?: string;
    }>;
};

@Controller('api/bets')
export class BetsController {
    constructor(
        private readonly svc: BetsService,
        private readonly jwtService: JwtService,
    ) {}

    /** 🔐 Extraction unifiée du userId depuis Authorization: Bearer <token> */
    private extractUser(headers: Record<string, string | undefined>) {
        const auth = headers['authorization'] as string | undefined;
        const fallback = headers['x-user-id'] || 'demo-user';

        if (!auth?.startsWith('Bearer ')) {
            console.warn('⚠️ Aucun header Authorization détecté, fallback utilisé:', fallback);
            return { id: fallback, role: 'guest' };
        }

        const token = auth.slice(7);
        try {
            const decoded = this.jwtService.verify(token) as any; // { id, sub, username, role... }
            const userId = decoded.id || decoded.sub;
            if (!userId) throw new Error('Champ id/sub manquant dans le token');

            console.log(`🔓 Token valide — userId = ${userId}, rôle = ${decoded.role ?? 'inconnu'}`);
            return { id: userId, role: decoded.role ?? 'user', username: decoded.username ?? '—' };
        } catch (err) {
            console.error('❌ Erreur décodage JWT dans BetsController:', err);
            throw new UnauthorizedException('Token invalide ou expiré');
        }
    }

    /** 📋 Liste des paris d’un utilisateur connecté */
    @Get()
    async list(@Headers() headers: Record<string, string | undefined>) {
        const user = this.extractUser(headers);
        console.log(`📜 Liste des paris demandée pour userId = ${user.id}`);
        return this.svc.listBets(user.id);
    }

    /** 📜 Historique d’un utilisateur spécifique */
    @Get('history/:userId')
    async getHistory(@Param('userId') userId: string) {
        console.log(`📜 Récupération de l’historique pour userId = ${userId}`);
        return this.svc.getUserHistory(userId);
    }

    /** 🎯 Création d’un nouveau pari */
    @Post()
    async place(
        @Headers() headers: Record<string, string | undefined>,
        @Body() body: PlaceBetBody,
    ) {
        const user = this.extractUser(headers);

        if (!body || !Array.isArray(body.selections)) {
            console.warn('⚠️ Corps de requête invalide:', body);
            throw new BadRequestException('Payload invalide');
        }

        console.log(
            `🎯 Nouvelle demande de pari — userId=${user.id}, mise=${body.stake}, selections=${body.selections.length}`,
        );

        try {
            const result = await this.svc.placeBet(user.id, body);
            console.log(
                `✅ Pari créé avec succès pour ${user.id} | Gain potentiel = ${result.potentialWin} ${result.currency}`,
            );
            return result;
        } catch (err: any) {
            console.error(`💥 Erreur lors de la création du pari pour ${user.id}:`, err.message);
            throw err;
        }
    }

    /** 🔄 Mise à jour d’un pari existant (résultat, statut, etc.) */
    @Put(':id')
    async updateBet(@Param('id') id: string, @Body() body: any) {
        console.log(`🛠️ Mise à jour du pari ${id}`);
        return this.svc.updateBet(id, body);
    }
}
