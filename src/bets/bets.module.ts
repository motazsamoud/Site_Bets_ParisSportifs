import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bet, BetSchema } from './bet.schema';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { WalletModule } from '../wallet/wallet.module';
import {JwtModule} from "@nestjs/jwt";

@Module({
    imports: [
        WalletModule,
        MongooseModule.forFeature([{ name: Bet.name, schema: BetSchema }]),
        JwtModule.register({
            secret: process.env.JWT_SECRET ||  'your-secret-key',  // Use a more secure secret in production
            signOptions: { expiresIn: '1h' },
            // Set token expiry (e.g., 1 hour)
        }),
    ],
    providers: [BetsService],
    controllers: [BetsController],
})
export class BetsModule {}
