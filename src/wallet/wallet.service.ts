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
                balance: 0,
                currency: 'TND',
            });
        }
        return wallet;
    }

    /** 🔹 Solde actuel */
    async getBalance(userId: string) {
        const wallet = await this.getOrCreate(userId);
        return {
            userId,
            balance: wallet.balance,
            currency: wallet.currency,
        };
    }

    /** 🔹 Crédit “admin” explicite — montant en TND */
    async adminCredit(adminRole: string, targetUserId: string, amount: number, meta?: TxMeta) {
        if (adminRole !== 'admin')
            throw new ForbiddenException('Seul un admin peut créditer un compte');
        if (!Number.isFinite(amount) || amount <= 0)
            throw new BadRequestException('Montant invalide');

        const wallet = await this.getOrCreate(targetUserId);
        wallet.balance += amount;
        await wallet.save();

        await this.txModel.create({
            userId: targetUserId,
            type: 'credit',
            amount,
            balanceAfter: wallet.balance,
            meta,
            createdAt: new Date(),
        });

        return wallet;
    }

    /** 🔹 Crédit standard — montant reçu en TND */
    async credit(userId: string, amount: number, meta?: TxMeta) {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new BadRequestException('Montant invalide');
        }

        const wallet = await this.getOrCreate(userId);
        wallet.balance += amount;
        await wallet.save();

        await this.txModel.create({
            userId,
            type: 'credit',
            amount,
            balanceAfter: wallet.balance,
            meta,
            createdAt: new Date(),
        });

        return {
            userId,
            balance: wallet.balance,
            currency: wallet.currency,
        };
    }

    /** 🔹 Débit si solde suffisant — montant en TND */
    async debitIfEnough(userId: string, amount: number, meta?: TxMeta) {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new BadRequestException('Montant invalide');
        }

        const wallet = await this.getOrCreate(userId);
        if (wallet.balance < amount) {
            throw new BadRequestException('Solde insuffisant');
        }

        wallet.balance -= amount;
        await wallet.save();

        await this.txModel.create({
            userId,
            type: 'debit',
            amount,
            balanceAfter: wallet.balance,
            meta,
            createdAt: new Date(),
        });

        return {
            userId,
            balance: wallet.balance,
            currency: wallet.currency,
        };
    }
}
