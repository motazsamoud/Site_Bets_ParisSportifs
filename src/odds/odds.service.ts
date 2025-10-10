import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

type OddsOpts = {
    regions?: string;
    markets?: string;
    bookmakers?: string; // CSV
    oddsFormat?: string;
};

@Injectable()
export class OddsService {
    private readonly base: string;
    private readonly defaultRegion: string;
    private readonly defaultMarkets: string;
    private readonly defaultBookmakers?: string;
    private readonly selectedKey = 'odds:selected_bookmakers';

    // 🔁 Gestion multi-API keys
    private apiKeys: string[];
    private currentKeyIndex = 0;

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {
        this.base = this.config.get<string>('ODDS_API_BASE', 'https://api.odds-api.io/v3');

        // 🔹 Récupère plusieurs clés depuis .env
        const rawKeys = this.config.get<string>('ODDS_API_KEY') ?? '';
        this.apiKeys = rawKeys.split(',').map((k) => k.trim()).filter(Boolean);
        if (!this.apiKeys.length) {
            throw new Error('❌ Aucune clé API OddsAPI trouvée dans ODDS_API_KEY');
        }

        this.defaultRegion = this.config.get<string>('ODDS_DEFAULT_REGION', 'eu');
        this.defaultMarkets = this.config.get<string>('ODDS_DEFAULT_MARKETS', 'ML,Spread,Totals');
        this.defaultBookmakers = this.config.get<string>('ODDS_DEFAULT_BOOKMAKERS');
    }

    // 🔁 Renvoie la clé actuelle
    private get currentKey(): string {
        return this.apiKeys[this.currentKeyIndex];
    }

    // 🔁 Passe à la clé suivante
    private rotateKey(): void {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        console.warn(`🔁 Rotation de clé OddsAPI → ${this.currentKey.slice(0, 8)}...`);
    }

    // 🔒 Gère automatiquement la rotation si une clé dépasse la limite
    private async safeGet(url: string, params: Record<string, any> = {}) {
        for (let i = 0; i < this.apiKeys.length; i++) {
            const apiKey = this.currentKey;
            try {
                const resp = await firstValueFrom(
                    this.http.get(url, { params: { ...params, apiKey } }),
                );
                return resp.data;
            } catch (e: any) {
                const msg = e?.response?.data?.error || e?.message;
                if (msg?.includes('exceeded your rate limit')) {
                    console.warn(`⚠️ Limite atteinte pour ${apiKey.slice(0, 8)}..., on passe à la suivante.`);
                    this.rotateKey();
                    await new Promise((r) => setTimeout(r, 200)); // petit délai
                    continue;
                }
                throw e;
            }
        }
        throw new BadRequestException('Toutes les clés OddsAPI ont atteint la limite horaire.');
    }

    // -------- SPORTS --------
    async getSports() {
        const cacheKey = 'odds:sports';
        try {
            const memo = (this.cache as any)?.get ? await this.cache.get(cacheKey) : null;
            if (memo) return memo;
        } catch {}
        try {
            const data = await this.safeGet(`${this.base}/sports`);
            try {
                await this.cache.set(cacheKey, data, 60_000);
            } catch {}
            return data;
        } catch (e: any) {
            console.error('❌ /sports:', e?.response?.data || e.message);
            throw new BadRequestException('Erreur lors de la récupération des sports');
        }
    }

    // -------- BOOKMAKERS --------
    async getBookmakers() {
        try {
            return await this.safeGet(`${this.base}/bookmakers`);
        } catch (e: any) {
            console.error('❌ /bookmakers:', e?.response?.data || e.message);
            throw new BadRequestException('Erreur lors de la récupération des bookmakers');
        }
    }

    async getSelectedBookmakers(): Promise<string[] | null> {
        try {
            const loc = (this.cache as any)?.get ? await this.cache.get<string[]>(this.selectedKey) : null;
            if (loc && loc.length) return loc;
        } catch {}
        try {
            const data = await this.safeGet(`${this.base}/bookmakers/selected`);
            const list: string[] = Array.isArray(data) ? data.map((x: any) => x.name || x) : [];
            if (list.length) {
                try {
                    await this.cache.set(this.selectedKey, list, 0);
                } catch {}
                return list;
            }
        } catch {}
        return null;
    }

    async setSelectedBookmakers(list: string[]) {
        const norm = (list || []).map((s) => s.trim()).filter(Boolean);
        try {
            await this.cache.set(this.selectedKey, norm, 0);
        } catch {}
        try {
            const data = await this.safeGet(`${this.base}/bookmakers/selected`, { bookmakers: norm });
            return { ok: true, provider: data };
        } catch {
            return { ok: true, provider: null };
        }
    }

    async clearSelectedBookmakers() {
        try {
            await this.cache.set(this.selectedKey, [], 0);
        } catch {}
        try {
            const data = await this.safeGet(`${this.base}/bookmakers/selected`);
            return { ok: true, provider: data };
        } catch {
            return { ok: true, provider: null };
        }
    }

    // -------- EVENTS --------
    async getEventsBySport(sportKey: string, regions?: string) {
        const r = regions || this.defaultRegion;
        try {
            return await this.safeGet(`${this.base}/events`, {
                sport: sportKey,
                regions: r,
            });
        } catch (e: any) {
            console.error('❌ /events:', e?.response?.data || e.message);
            throw new BadRequestException('Erreur lors de la récupération des évènements');
        }
    }

    // Helpers front
    async listLeagues(sportKey: string, regions?: string) {
        const events = await this.getEventsBySport(sportKey, regions);
        const uniq = new Map<string, { slug: string; name: string }>();
        for (const ev of Array.isArray(events) ? events : []) {
            const lg = ev?.league;
            if (lg?.slug && !uniq.has(lg.slug))
                uniq.set(lg.slug, { slug: lg.slug, name: lg.name });
        }
        return [...uniq.values()].sort((a, b) => a.name.localeCompare(b.name));
    }

    async getEventsByLeague(sportKey: string, leagueSlug: string, regions?: string) {
        const events = await this.getEventsBySport(sportKey, regions);
        return (Array.isArray(events) ? events : []).filter(
            (e) => e?.league?.slug === leagueSlug,
        );
    }

    async getLiveEvents(sportKey: string, regions?: string) {
        const events = await this.getEventsBySport(sportKey, regions);
        return (Array.isArray(events) ? events : []).filter(
            (e) => e?.status === 'live',
        );
    }

    // -------- ODDS --------
    private async resolveBooksCSV(override?: string): Promise<string | undefined> {
        if (override) return override;
        const selected = await this.getSelectedBookmakers();
        if (selected && selected.length) return selected.join(',');
        if (this.defaultBookmakers) return this.defaultBookmakers;
        return undefined;
    }

    async getOddsByEvent(
        eventId: string,
        opts?: { regions?: string; markets?: string; bookmakers?: string; oddsFormat?: string },
    ) {
        const r = opts?.regions || this.defaultRegion;
        const m = opts?.markets || this.defaultMarkets;
        const b =
            opts?.bookmakers && opts.bookmakers.trim() !== ''
                ? opts.bookmakers
                : this.config.get<string>('ODDS_DEFAULT_BOOKMAKERS', '');
        try {
            return await this.safeGet(`${this.base}/odds`, {
                eventId,
                regions: r,
                markets: m,
                ...(b ? { bookmakers: b } : {}),
                oddsFormat: opts?.oddsFormat,
            });
        } catch (e: any) {
            console.error('❌ /odds (event):', e?.response?.data || e.message);
            throw new BadRequestException(
                "Erreur lors de la récupération des cotes pour l'évènement",
            );
        }
    }

    async getOddsForSport(sportKey: string, opts?: OddsOpts & { limitEvents?: number }) {
        const events = await this.getEventsBySport(sportKey, opts?.regions);
        const list: any[] = Array.isArray(events)
            ? events.slice(0, Number(opts?.limitEvents || 10))
            : [];
        const b = await this.resolveBooksCSV(opts?.bookmakers);
        const out: any[] = [];
        for (const ev of list) {
            const evId = ev?.id ?? ev?.eventId ?? ev?.event_id;
            if (!evId) continue;
            try {
                const odds = await this.getOddsByEvent(String(evId), {
                    ...opts,
                    bookmakers: b,
                });
                out.push({ event: ev, odds });
            } catch {}
            await new Promise((res) => setTimeout(res, 100));
        }
        return out;
    }

    // -------- USAGE --------
    async getUsage() {
        try {
            return await this.safeGet(`${this.base}/usage`);
        } catch (e: any) {
            try {
                const resp = await this.safeGet(`${this.base}/sports`);
                const h = resp.headers || {};
                return {
                    from: 'headers',
                    requests_used: Number(h['x-requests-used'] ?? 0),
                    requests_remaining: Number(h['x-requests-remaining'] ?? 0),
                    last_cost: Number(h['x-requests-last'] ?? 0),
                };
            } catch (e2: any) {
                console.error('❌ /usage fallback:', e2?.response?.data || e2.message);
                throw new BadRequestException('Impossible de récupérer l’usage API');
            }
        }
    }

    // -------- MARKETS --------
    getMarketsList() {
        return [
            'H2H',
            'ML',
            'Spread',
            'Totals',
            'DrawNoBet',
            'BothTeamsToScore',
            'TeamTotalHome',
            'TeamTotalAway',
            '1stHalf-ML',
            '1stHalf-Spread',
            '1stHalf-Totals',
            '1Q-ML',
            '1Q-Spread',
            '1Q-Totals',
            'PlayerProps',
        ];
    }
}
