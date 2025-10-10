import {
    Controller,
    Get,
    Param,
    Query,
    HttpException,
    HttpStatus, BadRequestException,
} from '@nestjs/common';
import { LiveService } from './service';
import { OddsService } from '../odds/odds.service';

/**
 * 🎯 Contrôleur Live :
 *  - Récupère les infos en direct d’un match (score, minute, statut)
 *  - Récupère les cotes via OddsService
 *  - Fusionne le tout dans une seule réponse optimisée pour le frontend
 */
@Controller('api/live')
export class LiveController {
    constructor(
        private readonly liveService: LiveService,
        private readonly oddsService: OddsService,
    ) {}

    /**
     * Exemple :
     * GET /api/live/1035049?regions=eu&markets=H2H,Totals
     */
    @Get(':fixtureId')
    async getLiveData(
        @Param('fixtureId') fixtureId: string,
        @Query('regions') regions?: string,
        @Query('markets') markets?: string,
        @Query('bookmakers') bookmakers?: string,
        @Query('oddsFormat') oddsFormat?: string,
    ) {
        try {
            // 1️⃣ Récupération des infos live via API-Sports
            const liveData = await this.liveService.getFixture(fixtureId);

            // 2️⃣ Récupération des cotes du même match via Odds API
            const oddsData = await this.oddsService.getOddsByEvent(fixtureId, {
                regions: regions ?? 'eu',
                markets:
                    markets ??
                    'H2H,Totals,Spread,Double Chance,Draw No Bet,Both Teams To Score',
                bookmakers,
                oddsFormat,
            });

            // 3️⃣ Vérification de la présence de données
            if (!liveData && !oddsData) {
                throw new HttpException(
                    'Aucune donnée disponible pour ce match',
                    HttpStatus.NOT_FOUND,
                );
            }

            // 4️⃣ Fusion : données live + cotes
            return {
                fixtureId,
                updatedAt: new Date().toISOString(),
                live: liveData || {},
                odds: oddsData || {},
            };
        } catch (err: any) {
            console.error('[LiveController] Erreur getLiveData:', err.message);
            throw new HttpException(
                'Erreur lors de la récupération des données live',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    @Get(':fixtureId')
    async getLive(@Param('fixtureId') fixtureId: string, @Query('sport') sport?: string) {
        try {
            const data = await this.oddsService.getOddsByEvent(fixtureId, {
                regions: 'eu',
                markets: 'ML',
            });

            // structure variable selon OddsAPI → on adapte :
            const event = data?.event ?? data?.[0]?.event ?? data;

            if (!event) throw new BadRequestException('Aucun match trouvé pour cet ID');

            // ⚽ On normalise la sortie pour ton front :
            return {
                id: event.id ?? fixtureId,
                status: event.status ?? event?.scores?.status ?? 'unknown',
                minute:
                    event.timer?.minute ??
                    event.timer?.elapsed ??
                    event.time?.elapsed ??
                    null,
                goalsHome: event.scores?.home ?? event.home_score ?? event.home_score_current ?? null,
                goalsAway: event.scores?.away ?? event.away_score ?? event.away_score_current ?? null,
                score:
                    event.scores?.home != null && event.scores?.away != null
                        ? `${event.scores.home}:${event.scores.away}`
                        : null,
                kickoffAt: event.commence_time ?? event.start_time ?? event.date ?? null,
            };
        } catch (e) {
            console.error('❌ /live/:fixtureId', e?.response?.data || e.message);
            throw new BadRequestException('Impossible de récupérer le match en direct');
        }
    }



}
