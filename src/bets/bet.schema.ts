import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void';

@Schema({ _id: false })
export class Selection {
    @Prop({ required: true }) eventId!: string;
    @Prop({ required: true }) market!: string;     // "Résultat du match (1X2)"
    @Prop({ required: true }) outcomeKey!: string; // "home" | "draw" | "away" | etc.
    @Prop({ required: true }) price!: number;      // decimal
    @Prop() line?: string;
    @Prop() bookmaker?: string;
    @Prop() label?: string;                        // "1 @ 1.92"
    @Prop() home?: string;
    @Prop() away?: string;
}

@Schema({ timestamps: true, collection: 'bets' })
export class Bet extends Document {
    @Prop({ required: true, index: true }) userId!: string;

    @Prop({ type: [Selection], required: true })
    selections!: Selection[];

    @Prop({ required: true }) stakeCents!: number;
    @Prop({ required: true }) potentialWinCents!: number;
    @Prop({ required: true }) combinedOdds!: number;

    @Prop({ required: true, default: 'pending' })
    status!: BetStatus;
}
export const BetSchema = SchemaFactory.createForClass(Bet);
