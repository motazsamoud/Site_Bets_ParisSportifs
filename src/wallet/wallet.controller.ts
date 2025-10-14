import {
    Body,
    Controller,
    Get,
    Headers,
    Post,
    BadRequestException,
    ForbiddenException,
    Param,
    NotFoundException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtService } from '@nestjs/jwt';

/**
 * Routes Wallet
 * - GET    /api/wallet
 * - POST   /api/wallet/faucet
 * - POST   /api/wallet/admin/credit
 * - GET    /api/wallet/:userId
 */
@Controller('api/wallet')
export class WalletController {
    constructor(
        private readonly svc: WalletService,
        private readonly jwtService: JwtService,
    ) {}

    /** 🔐 Extrait l'utilisateur depuis “Authorization: Bearer <token>” */
    private extractUser(headers: Record<string, string | undefined>) {
        const auth = headers['authorization'] as string | undefined;
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;

        if (!token) throw new ForbiddenException('Token manquant');

        try {
            const decoded = this.jwtService.verify(token) as any; // { id? sub? username role ... }
            const id = decoded.id || decoded.sub;
            if (!id) throw new Error('id manquant dans le token');
            return decoded;
        } catch {
            throw new ForbiddenException('Token invalide');
        }
    }

    /** 👤 Solde utilisateur connecté (création auto) */
    @Get()
    async get(@Headers() headers: Record<string, string | undefined>) {
        const user = this.extractUser(headers);
        const userId = user.id || user.sub;
        const wallet = await this.svc.getBalance(userId);
        return wallet;
    }

    /** 🪙 Faucet (dev/test) — crédite le compte connecté */
    @Post('faucet')
    async faucet(
        @Headers() headers: Record<string, string | undefined>,
        @Body() body: { amount?: number },
    ) {
        const user = this.extractUser(headers);
        const userId = user.id || user.sub;

        const amountUnits = Number(body?.amount ?? 1_000_000);
        if (!Number.isFinite(amountUnits) || amountUnits <= 0) {
            throw new BadRequestException('Montant faucet invalide');
        }

        const amountCents = Math.floor(amountUnits * 100);
        return this.svc.credit(userId, amountCents, { source: 'faucet' });
    }

    /** 👑 Admin: créditer un autre utilisateur */
    @Post('admin/credit')
    async adminCredit(
        @Headers() headers: Record<string, string | undefined>,
        @Body() body: { targetUserId: string; amount: number; note?: string },
    ) {
        const admin = this.extractUser(headers);
        if (admin.role !== 'admin') {
            throw new ForbiddenException('Accès refusé : réservé aux administrateurs');
        }

        const amountCents = Math.floor(Number(body.amount) * 100);
        if (!body.targetUserId || !Number.isFinite(amountCents) || amountCents <= 0) {
            throw new BadRequestException('Données invalides pour crédit');
        }

        return this.svc.adminCredit(admin.role, body.targetUserId, amountCents, {
            source: 'admin-panel',
            note: body.note || 'Ajout manuel par admin',
            adminId: admin.id || admin.sub,
        });
    }

    /** 🔎 Lecture directe (outil/admin) */
    @Get(':userId')
    async getUserWallet(@Param('userId') userId: string) {
        try {
            const wallet = await this.svc.getBalance(userId);
            if (!wallet) throw new NotFoundException(`Wallet introuvable pour userId: ${userId}`);
            return wallet;
        } catch (err: any) {
            throw new HttpException(err.message || 'Erreur serveur', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
