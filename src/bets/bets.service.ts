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

    /** Nettoie + valide les sélections (1 seule par fixture) */
    private normalizeSelections(raw: any[]): Selection[] {
        if (!Array.isArray(raw) || raw.length === 0) {
            throw new BadRequestException('Aucune sélection');
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
                throw new BadRequestException('Sélection invalide: price');
            }

            // ✅ une seule sélection par match : on remplace la précédente si besoin
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


    /** Cote combinée */
    private computeCombinedOdds(selections: Selection[]) {
        const mul = selections.reduce((acc, s) => acc * (s.price || 1), 1);
        return Math.round(mul * 10000) / 10000;
    }

    /** Place un pari : débit puis création du bet (sans transaction) */
    async placeBet(
        userId: string,
        body: { stake: number; selections: any[] },
    ) {
        const selections = this.normalizeSelections(body.selections);

        const stakeCents = Math.floor(Number(body.stake) * 100);
        if (!Number.isFinite(stakeCents) || stakeCents <= 0) {
            throw new BadRequestException('Stake invalide');
        }

        const combinedOdds = this.computeCombinedOdds(selections);
        const potentialWinCents = Math.floor(stakeCents * combinedOdds);

        // 1) Débit du wallet (signature à 2..3 args → pas de session)
        await this.wallet.debitIfEnough(userId, stakeCents, { reason: 'bet_place' });

        // 2) Création du pari
        const bet = await this.betModel.create({
            userId,
            selections,
            stakeCents,
            potentialWinCents,
            combinedOdds,
            status: 'pending',
            createdAt: new Date(),
        });

        // 3) Retourne le solde à jour pour l’UI
        const { balanceCents, currency } = await this.wallet.getBalance(userId);

        return {
            betId: String(bet._id),
            combinedOdds,
            stakeCents,
            potentialWinCents,
            currency,
            balanceCents,
        };
    }

    /** Liste des paris */
    async listBets(userId: string) {
        const rows = await this.betModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        // on normalise l’ID et on expose les champs attendus par le front
        return rows.map((r: any) => ({
            id: String(r._id),
            userId: r.userId,
            selections: r.selections,
            stakeCents: r.stakeCents,
            potentialWinCents: r.potentialWinCents,
            combinedOdds: r.combinedOdds,
            status: r.status,
            createdAt: r.createdAt,
        }));
    }
    async getUserHistory(userId: string) {
        return this.betModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }


    // bets.service.ts
    // ✅ Version Mongoose (pas Prisma)
    // ✅ Mise à jour Mongoose, compatible avec ton schéma actuel
    // ✅ Mise à jour Mongoose + crédit automatique du gain si "won"
    // ✅ updateBet sécurisé et historique
    async updateBet(id: string, data: any) {
        const existing = await this.betModel.findById(id);
        if (!existing) throw new BadRequestException("Pari introuvable");

        // 🧱 Si déjà terminé (won/lost/void), on ne change plus rien
        if (["won", "lost", "void"].includes(existing.status)) {
            console.log(`⛔ Pari déjà finalisé (${existing.status}), mise à jour ignorée`);
            return existing;
        }

        // 🔁 Met à jour uniquement les paris encore "pending"
        if (data.status) existing.status = data.status;
        if (data.selections) existing.selections = data.selections;
        (existing as any).updatedAt = new Date();

        await existing.save();

        // 💰 Crédit automatique si "won"
        if (existing.status === "won") {
            await this.wallet.credit(existing.userId, existing.potentialWinCents, {
                reason: "bet_win",
                metadata: { betId: String(existing._id) },
            });
        }

        // 🧾 Archive du pari final (dans bets_history)
        if (["won", "lost"].includes(existing.status)) {
            try {
                await this.archiveBet(existing);
            } catch (err) {
                console.error("❌ Erreur archive bet:", err);
            }
        }

        return existing;
    }

    /** 🔹 Archive un pari finalisé */
    private async archiveBet(bet: any) {
        const historyModel = this.betModel.db.model("bets_history", this.betModel.schema);
        const doc = await historyModel.findOne({ betId: bet._id });
        if (doc) return; // déjà archivé

        await historyModel.create({
            betId: bet._id,
            userId: bet.userId,
            selections: bet.selections,
            stakeCents: bet.stakeCents,
            potentialWinCents: bet.potentialWinCents,
            combinedOdds: bet.combinedOdds,
            status: bet.status,
            archivedAt: new Date(),
        });

        console.log(`📦 Pari archivé dans bets_history (${bet._id})`);
    }





}
