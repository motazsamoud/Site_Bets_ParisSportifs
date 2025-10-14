import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bet, BetSchema } from './bet.schema';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { WalletModule } from '../wallet/wallet.module';
import {JwtModule} from "@nestjs/jwt";
import {UserModule} from "src/user/user.module";

@Module({
    imports: [
        WalletModule,
        MongooseModule.forFeature([{ name: Bet.name, schema: BetSchema }]),
        UserModule,
    ],
    providers: [BetsService],
    controllers: [BetsController],
})
export class BetsModule {}
