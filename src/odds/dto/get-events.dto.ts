import { IsOptional, IsString } from 'class-validator';

export class GetEventsDto {
    @IsOptional()
    @IsString()
    regions?: string; // ex: eu, us, uk
}
