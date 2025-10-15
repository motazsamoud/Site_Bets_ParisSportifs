import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type TxType = 'credit' | 'debit' | 'bet_place' | 'bet_settle';

@Schema({ timestamps: true, collection: 'wallet_transactions' })
export class WalletTx extends Document {
    @Prop({ required: true, index: true }) userId!: string;
    @Prop({ required: true }) type!: TxType;
    @Prop({ required: true }) amount!: number;
    @Prop({ required: true }) balanceAfter!: number;
    @Prop({ type: Object }) meta?: Record<string, any>;
}
export const WalletTxSchema = SchemaFactory.createForClass(WalletTx);
