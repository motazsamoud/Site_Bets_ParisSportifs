import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class GetOddsSportDto {
    @IsOptional() @IsString() regions?: string;
    @IsOptional() @IsString() markets?: string;
    @IsOptional() @IsString() bookmakers?: string;
    @IsOptional() @IsNumberString() limitEvents?: string; // ex: "10"
}
