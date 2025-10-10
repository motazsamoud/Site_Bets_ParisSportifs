import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    BadRequestException,
    Inject,
    Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LiveService {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {
        this.baseUrl =
            this.config.get<string>('APISPORTS_BASE') ??
            'https://v3.football.api-sports.io';
        this.apiKey = this.config.get<string>('APISPORTS_KEY') ?? '';
    }

    /**
     * ⚽ Récupère et normalise les infos live d’un match (avec cache 2s)
     */
    async getFixture(fixtureId: string): Promise<any> {
        if (!fixtureId) throw new BadRequestException('fixtureId manquant');

        const cacheKey = `live:fixture:${fixtureId}`;

        // ✅ on essaie de lire le cache via this.cache
        try {
            const cached = await this.cache.get<any>(cacheKey);
            if (cached) {
                console.log(`[CACHE] Hit for fixture ${fixtureId}`);
                return cached;
            }
        } catch (e) {
            console.warn('[CACHE] lecture impossible:', e?.message);
        }

        try {
            // ⚡ appel API principale (fixture)
            const res = await firstValueFrom(
                this.http.get<any>(`${this.baseUrl}/fixtures`, {
                    headers: { 'x-apisports-key': this.apiKey },
                    params: { id: fixtureId },
                    timeout: 3000,
                } as any),
            );

            const fixture = res.data?.response?.[0];
            if (!fixture) return null;

            const goals = fixture.goals ?? {};
            const status = fixture.fixture?.status ?? {};

            const live = {
                id: fixtureId,
                league: fixture.league?.name ?? 'N/A',
                home: fixture.teams?.home?.name ?? 'N/A',
                away: fixture.teams?.away?.name ?? 'N/A',
                score: `${goals.home ?? 0} - ${goals.away ?? 0}`,
                minute: Number(status?.elapsed ?? 0),
                statusShort: status?.short ?? 'N/A',
                statusLong: status?.long ?? 'N/A',
                possession: { home: null as number | null, away: null as number | null },
            };

            // 🔹 Récupère la possession si dispo
            try {
                const statsRes = await firstValueFrom(
                    this.http.get<any>(`${this.baseUrl}/fixtures/statistics`, {
                        headers: { 'x-apisports-key': this.apiKey },
                        params: { fixture: fixtureId },
                        timeout: 2000,
                    } as any),
                );

                const resp = statsRes.data?.response;
                if (Array.isArray(resp) && resp.length >= 2) {
                    const homeStats = resp.find(
                        (s: any) => s?.team?.id === fixture.teams?.home?.id,
                    );
                    const awayStats = resp.find(
                        (s: any) => s?.team?.id === fixture.teams?.away?.id,
                    );

                    const parsePoss = (obj: any) =>
                        Number(
                            (obj?.statistics?.find(
                                (x: any) => x.type === 'Ball Possession',
                            )?.value ?? '0').replace('%', ''),
                        );

                    if (homeStats && awayStats) {
                        live.possession = {
                            home: parsePoss(homeStats),
                            away: parsePoss(awayStats),
                        };
                    }
                }
            } catch (err) {
                console.warn('[LiveService] Possession non disponible:', err.message);
            }

            // ✅ on tente d’écrire dans le cache (2 s)
            try {
                await this.cache.set(cacheKey, live, 2);
                console.log(`[CACHE] Stored fixture ${fixtureId}`);
            } catch (e) {
                console.warn('[CACHE] écriture impossible:', e?.message);
            }

            return live;
        } catch (err: any) {
            console.error('[LiveService] Erreur API-Sports:', err.message);
            throw new BadRequestException('Erreur lors de la récupération live');
        }
    }
}
