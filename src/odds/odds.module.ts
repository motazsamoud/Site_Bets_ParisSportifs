import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OddsController } from './odds.controller';
import { OddsService } from './odds.service';
import { OddsGateway } from './odds.gateway';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.register({
            isGlobal: true,
            // cache-manager v5 -> préciser le store 'memory'
            // (le cast évite une gêne de typings)
            store: 'memory' as any,
            ttl: 30_000, // ms (v5 = millisecondes)
            // max: 500,  // (optionnel) nombre d’entrées
        }),
        HttpModule.register({
            timeout: 8000,
            maxRedirects: 3,
        }),
    ],
    controllers: [OddsController],
    providers: [OddsService, OddsGateway],
    exports: [OddsService],
})
export class OddsModule {}
