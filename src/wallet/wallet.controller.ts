import {
    Body,
    Controller,
    Get,
    Headers,
    Post,
    BadRequestException,
    ForbiddenException, Param, NotFoundException, HttpException, HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtService } from '@nestjs/jwt';

/**
 * 🎯 WalletController
 * Gère le solde virtuel de chaque utilisateur.
 * - GET /api/wallet              : obtenir le solde
 * - POST /api/wallet/faucet      : créditer soi-même (test)
 * - POST /api/wallet/admin/credit: admin crédite un autre utilisateur
 */
@Controller('api/wallet')
export class WalletController {
    constructor(
        private readonly svc: WalletService,
        private readonly jwtService: JwtService,
    ) {}

    /** 🔹 Extraire l'user depuis le JWT envoyé dans les headers */
    private extractUser(headers: Record<string, string | undefined>) {
        const token = headers.authorization?.replace('Bearer ', '');
        if (!token) throw new ForbiddenException('Token manquant');

        try {
            const decoded = this.jwtService.verify(token);
            return decoded; // { id, email, username, role, ... }
        } catch {
            throw new ForbiddenException('Token invalide');
        }
    }

    /** 🔹 Récupérer le solde de l’utilisateur connecté */
    @Get()
    async get(@Headers() headers: Record<string, string | undefined>) {
        const user = this.extractUser(headers);
        const wallet = await this.svc.getBalance(user.id);
        console.log("📤 Réponse envoyée au front:", wallet);
        return wallet;
    }



    /** 🔹 Crédit test (faucet) — réservé pour debug/dev */
    @Post('faucet')
    async faucet(
        @Headers() headers: Record<string, string | undefined>,
        @Body() body: { amount?: number },
    ) {
        const user = this.extractUser(headers);
        const amountUnits = Number(body?.amount ?? 1_000_000);

        if (!Number.isFinite(amountUnits) || amountUnits <= 0) {
            throw new BadRequestException('Montant faucet invalide');
        }

        const amountCents = Math.floor(amountUnits * 100);
        console.log(`💸 Faucet de ${amountUnits} TND pour ${user.username}`);
        return this.svc.credit(user.id, amountCents, { source: 'faucet' });
    }

    /** 🔹 Créditer un autre utilisateur (ADMIN uniquement) */
    @Post('admin/credit')
    async adminCredit(
        @Headers() headers: Record<string, string | undefined>,
        @Body()
            body: {
            targetUserId: string;
            amount: number;
            note?: string;
        },
    ) {
        const admin = this.extractUser(headers);
        if (admin.role !== 'admin') {
            throw new ForbiddenException('Accès refusé : réservé aux administrateurs');
        }

        const amountCents = Math.floor(Number(body.amount) * 100);
        if (!body.targetUserId || !Number.isFinite(amountCents) || amountCents <= 0) {
            throw new BadRequestException('Données invalides pour crédit');
        }

        console.log(
            `🧑‍💼 Admin ${admin.username} crédite ${body.targetUserId} de ${body.amount} TND`,
        );

        return this.svc.adminCredit(admin.role, body.targetUserId, amountCents, {
            source: 'admin-panel',
            note: body.note || 'Ajout manuel par admin',
            adminId: admin.id,
        });
    }
    @Get(':userId')
    async getUserWallet(@Param('userId') userId: string) {
        try {
            const wallet = await this.svc.getBalance(userId);
            if (!wallet) {
                throw new NotFoundException(`Wallet introuvable pour userId: ${userId}`);
            }
            return {
                userId: wallet.userId,
                balanceCents: wallet.balanceCents,
                currency: wallet.currency,
            };
        } catch (err) {
            console.error("💥 Erreur getUserWallet:", err);
            throw new HttpException(err.message || "Erreur serveur", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
