import { BadRequestException, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet } from './wallet.schema';
import { WalletTx } from './tx.schema';

type TxMeta = Record<string, any>;

@Injectable()
export class WalletService {
    constructor(
        @InjectModel(Wallet.name) private readonly walletModel: Model<Wallet>,
        @InjectModel(WalletTx.name) private readonly txModel: Model<WalletTx>,
    ) {}

    /** 🔹 Récupère ou crée un wallet (utilisé lors du login) */
    async getOrCreate(userId: string) {
        const id = userId.toString();
        console.log(`🧩 Recherche wallet pour userId = ${id}`);

        let wallet = await this.walletModel.findOne({ userId: id }).exec();
        console.log("🔎 Résultat Mongo findOne:", wallet);

        if (wallet) {
            console.log(`💰 Wallet existant trouvé pour ${id}`);
            return wallet;
        }

        console.log(`🪙 Aucun wallet trouvé → création d’un nouveau pour ${id}`);
        wallet = await this.walletModel.create({
            userId: id,
            balanceCents: 0,
            currency: 'TND',
        });

        return wallet;
    }




    /** 🔹 Récupère le solde actuel */
    async getBalance(userId: string) {
        console.log(`🔍 getBalance() appelé pour ${userId}`);
        const wallet = await this.getOrCreate(userId);
        console.log("💳 Wallet trouvé:", wallet);
        return {
            userId,
            balanceCents: wallet.balanceCents,
            currency: wallet.currency,
        };
    }


    /** 🔹 Créditer le compte (uniquement admin) */
    async adminCredit(adminRole: string, targetUserId: string, amountCents: number, meta?: TxMeta) {
        if (adminRole !== 'admin') throw new ForbiddenException('Seul un admin peut créditer un compte');
        if (!Number.isFinite(amountCents) || amountCents <= 0) throw new BadRequestException('Montant invalide');

        const wallet = await this.getOrCreate(targetUserId);
        wallet.balanceCents += amountCents;
        await wallet.save();

        await this.txModel.create({
            userId: targetUserId,
            type: 'credit',
            amountCents,
            balanceAfterCents: wallet.balanceCents,
            meta,
            createdAt: new Date(),
        });

        console.log(`✅ Admin a crédité ${amountCents / 100} ${wallet.currency} → ${targetUserId}`);
        return wallet;
    }

    /** 🔹 Créditer le compte (usage interne auto) */
    async credit(userId: string, amountCents: number, meta?: TxMeta) {
        if (!Number.isFinite(amountCents) || amountCents < 0) {
            throw new BadRequestException('Montant invalide');
        }

        const wallet = await this.getOrCreate(userId);
        wallet.balanceCents += amountCents;
        await wallet.save();

        await this.txModel.create({
            userId,
            type: 'credit',
            amountCents,
            balanceAfterCents: wallet.balanceCents,
            meta,
            createdAt: new Date(),
        });

        return {
            userId,
            balanceCents: wallet.balanceCents,
            currency: wallet.currency,
        };
    }

    /** 🔹 Débiter si solde suffisant */
    async debitIfEnough(userId: string, amountCents: number, meta?: TxMeta) {
        if (!Number.isFinite(amountCents) || amountCents <= 0)
            throw new BadRequestException('Montant invalide');

        const wallet = await this.walletModel.findOne({ userId });
        if (!wallet) throw new BadRequestException('Wallet introuvable');
        if (wallet.balanceCents < amountCents)
            throw new BadRequestException('Solde insuffisant');

        wallet.balanceCents -= amountCents;
        await wallet.save();

        await this.txModel.create({
            userId,
            type: 'debit',
            amountCents,
            balanceAfterCents: wallet.balanceCents,
            meta,
            createdAt: new Date(),
        });

        return {
            userId,
            balanceCents: wallet.balanceCents,
            currency: wallet.currency,
        };
    }
}
