import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Wallet, WalletSchema } from './wallet.schema';
import { WalletTx, WalletTxSchema } from './tx.schema';
import { UserModule } from 'src/user/user.module'; // ✅ important

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Wallet.name, schema: WalletSchema },
            { name: WalletTx.name, schema: WalletTxSchema },
        ]),
        forwardRef(() => UserModule), // ✅ corrige la dépendance circulaire
    ],
    controllers: [WalletController],
    providers: [WalletService],
    exports: [WalletService],
})
export class WalletModule {}
