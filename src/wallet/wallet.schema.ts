import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'wallets' })
export class Wallet extends Document {
    @Prop({ required: true, index: true, unique: true })
    userId!: string;

    @Prop({ required: true, default: 0 })
    balanceCents!: number;

    @Prop({ required: true, default: 'TND' })
    currency!: string;
}
export const WalletSchema = SchemaFactory.createForClass(Wallet);
