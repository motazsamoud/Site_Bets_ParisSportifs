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

    async getBalance(userId: string) {
        const wallet = await this.getOrCreate(userId);
        return {
            userId,
            balanceCents: wallet.balanceCents / 100,
            currency: wallet.currency,
        };
    }

    async adminCredit(adminRole: string, targetUserId: string, amountTND: number, meta?: TxMeta) {
        if (adminRole !== 'admin')
            throw new ForbiddenException('Seul un admin peut créditer un compte');
        if (!Number.isFinite(amountTND) || amountTND <= 0)
            throw new BadRequestException('Montant invalide');

        const amount = Math.floor(amountTND);
        const wallet = await this.getOrCreate(targetUserId);
        wallet.balanceCents += amount;
        await wallet.save();

        await this.txModel.create({
            userId: targetUserId,
            type: 'credit',
            amount,
            balanceAfter: wallet.balanceCents,
            meta,
            createdAt: new Date(),
        });

        return wallet;
    }

    async credit(userId: string, amountTND: number, meta?: TxMeta) {
        if (!Number.isFinite(amountTND) || amountTND <= 0) {
            throw new BadRequestException('Montant invalide');
        }

        // ✅ correction : plus de *100
        const amount = Math.floor(amountTND);
        const wallet = await this.getOrCreate(userId);
        wallet.balanceCents += amount;
        await wallet.save();

        await this.txModel.create({
            userId,
            type: 'credit',
            amount,
            balanceAfter: wallet.balanceCents,
            meta,
            createdAt: new Date(),
        });

        return {
            userId,
            balanceCents: wallet.balanceCents / 100,
            currency: wallet.currency,
        };
    }

    async debitIfEnough(userId: string, amountTND: number, meta?: TxMeta) {
        if (!Number.isFinite(amountTND) || amountTND <= 0) {
            throw new BadRequestException('Montant invalide');
        }

        const amount = Math.floor(amountTND);
        const wallet = await this.getOrCreate(userId);
        if (wallet.balanceCents < amount) {
            throw new BadRequestException('Solde insuffisant');
        }

        wallet.balanceCents -= amount;
        await wallet.save();

        await this.txModel.create({
            userId,
            type: 'debit',
            amount,
            balanceAfter: wallet.balanceCents,
            meta,
            createdAt: new Date(),
        });

        return {
            userId,
            balanceCents: wallet.balanceCents / 100,
            currency: wallet.currency,
        };
    }
}
