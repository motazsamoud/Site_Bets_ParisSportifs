import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bet, BetSchema } from './bet.schema';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        WalletModule,
        MongooseModule.forFeature([{ name: Bet.name, schema: BetSchema }]),
    ],
    providers: [BetsService],
    controllers: [BetsController],
})
export class BetsModule {}
