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

    /** 🔹 Récupère ou crée un wallet pour l’utilisateur */
    async getOrCreate(userId: string) {
        const id = String(userId);
        let wallet = await this.walletModel.findOne({ userId: id }).exec();
        if (!wallet) {
            wallet = await this.walletModel.create({
                userId: id,
                balanceCents: 0,
                currency: 'TND',
            });
        }
        return wallet;
    }

    /** 🔹 Solde actuel (création auto si absent) */
    async getBalance(userId: string) {
        const wallet = await this.getOrCreate(userId);
        return {
            userId,
            balanceCents: wallet.balanceCents,
            currency: wallet.currency,
        };
    }

    /** 🔹 Crédit “admin” explicite — montant reçu en TND */
    async adminCredit(adminRole: string, targetUserId: string, amountTND: number, meta?: TxMeta) {
        if (adminRole !== 'admin')
            throw new ForbiddenException('Seul un admin peut créditer un compte');
        if (!Number.isFinite(amountTND) || amountTND <= 0)
            throw new BadRequestException('Montant invalide');

        const amountCents = Math.floor(amountTND * 100);
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

        return wallet;
    }

    /** 🔹 Crédit standard — montant reçu en TND */
    async credit(userId: string, amountTND: number, meta?: TxMeta) {
        if (!Number.isFinite(amountTND) || amountTND <= 0) {
            throw new BadRequestException('Montant invalide');
        }

        const amountCents = Math.floor(amountTND * 100);
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

    /** 🔹 Débit si solde suffisant — montant reçu en TND */
    async debitIfEnough(userId: string, amountTND: number, meta?: TxMeta) {
        if (!Number.isFinite(amountTND) || amountTND <= 0) {
            throw new BadRequestException('Montant invalide');
        }

        const amountCents = Math.floor(amountTND * 100);
        const wallet = await this.getOrCreate(userId);
        if (wallet.balanceCents < amountCents) {
            throw new BadRequestException('Solde insuffisant');
        }

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
