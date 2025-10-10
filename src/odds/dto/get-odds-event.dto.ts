import { IsOptional, IsString } from 'class-validator';

export class GetOddsEventDto {
    @IsOptional() @IsString() regions?: string;
    @IsOptional() @IsString() markets?: string;      // ex: ML,Spread,Totals
    @IsOptional() @IsString() bookmakers?: string;   // ex: Bet365,Unibet
    @IsOptional() @IsString() oddsFormat?: 'decimal' | 'american';
}
