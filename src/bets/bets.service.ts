import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bet } from './bet.schema';
import { WalletService } from '../wallet/wallet.service';
import { Selection } from './bet.schema';

@Injectable()
export class BetsService {
    constructor(
        @InjectModel(Bet.name) private readonly betModel: Model<Bet>,
        private readonly wallet: WalletService,
    ) {}

    /** 🧹 Nettoie + valide les sélections (une seule par match) */
    private normalizeSelections(raw: any[]): Selection[] {
        if (!Array.isArray(raw) || raw.length === 0) {
            throw new BadRequestException('Aucune sélection fournie');
        }

        const out: Selection[] = [];
        const seen = new Set<string>();

        for (const r of raw) {
            const eventId = String(r?.eventId || '').trim();
            const market = String(r?.market || '').trim();
            const outcomeKey = String(r?.outcomeKey || '').trim();
            const priceNum = Number(r?.price);

            if (!eventId || !market || !outcomeKey) {
                throw new BadRequestException('Sélection invalide: champs manquants');
            }
            if (!Number.isFinite(priceNum) || priceNum < 1) {
                throw new BadRequestException('Sélection invalide: prix incorrect');
            }

            // ✅ empêche doublons par match
            if (seen.has(eventId)) {
                const idx = out.findIndex((s) => s.eventId === eventId);
                if (idx !== -1) out.splice(idx, 1);
            }
            seen.add(eventId);

            out.push({
                eventId,
                market,
                outcomeKey,
                price: Math.round(priceNum * 10000) / 10000,
                label: r?.label ?? `${outcomeKey} @ ${priceNum}`,
                bookmaker: r?.bookmaker ? String(r.bookmaker) : undefined,
                home: r?.home ? String(r.home) : undefined,
                away: r?.away ? String(r.away) : undefined,
            });
        }

        if (out.length > 30) {
            throw new BadRequestException('Trop de sélections (max 30)');
        }

        return out;
    }

    /** 🔹 Calcul des cotes combinées */
    private computeCombinedOdds(selections: Selection[]) {
        const mul = selections.reduce((acc, s) => acc * (s.price || 1), 1);
        return Math.round(mul * 10000) / 10000;
    }

    /** 🎯 Place un pari : débit wallet + création du bet */
    /** 🎯 Place un pari : débit wallet + création du bet */

    async placeBet(userId: string, body: { stake: number; selections: any[] }) {
        const selections = this.normalizeSelections(body.selections);

        const stake = Number(body.stake);
        if (!Number.isFinite(stake) || stake <= 0) {
            throw new BadRequestException('Stake invalide');
        }

        const combinedOdds = this.computeCombinedOdds(selections);
        const potentialWin = stake * combinedOdds;

        // 💳 Débit réel du wallet en TND
        await this.wallet.debitIfEnough(userId, stake, { reason: 'bet_place' });

        // 🧾 Enregistrement du pari
        const bet = await this.betModel.create({
            userId,
            selections,
            stake,
            potentialWin,
            combinedOdds,
            status: 'pending',
            createdAt: new Date(),
        });

        // 💰 Solde à jour
        const { balanceCents, currency } = await this.wallet.getBalance(userId);

        return {
            betId: String(bet._id),
            combinedOdds,
            stake,
            potentialWin,
            currency,
            balanceCents,
        };
    }

    /** 🔹 Liste des paris d’un utilisateur */
    async listBets(userId: string) {
        const rows = await this.betModel.find({ userId }).sort({ createdAt: -1 }).lean();

        return rows.map((r: any) => ({
            id: String(r._id),
            userId: r.userId,
            selections: r.selections,
            stake: r.stake,
            potentialWin: r.potentialWin,
            combinedOdds: r.combinedOdds,
            status: r.status,
            createdAt: r.createdAt,
        }));
    }

    /** 🔹 Historique d’un utilisateur */
    async getUserHistory(userId: string) {
        return this.betModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    }

    /** 🔄 Mise à jour d’un pari (résultat, statut, etc.) */
    async updateBet(id: string, data: any) {
        const existing = await this.betModel.findById(id);
        if (!existing) throw new BadRequestException('Pari introuvable');

        if (['won', 'lost', 'void'].includes(existing.status)) return existing;

        if (data.status) existing.status = data.status;
        if (data.selections) existing.selections = data.selections;
        (existing as any).updatedAt = new Date();
        await existing.save();

        if (existing.status === 'won') {
            await this.wallet.credit(existing.userId, existing.potentialWin, {
                reason: 'bet_win',
                metadata: { betId: String(existing._id) },
            });
        }

        return existing;
    }

    /** 📦 Archive un pari finalisé */
    private async archiveBet(bet: any) {
        const historyModel = this.betModel.db.model('bets_history', this.betModel.schema);
        const doc = await historyModel.findOne({ betId: bet._id });
        if (doc) return; // déjà archivé

        await historyModel.create({
            betId: bet._id,
            userId: bet.userId,
            selections: bet.selections,
            stake: bet.stake,
            potentialWin: bet.potentialWin,
            combinedOdds: bet.combinedOdds,
            status: bet.status,
            archivedAt: new Date(),
        });

        console.log(`📦 Pari archivé (${bet._id})`);
    }
}
