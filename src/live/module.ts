import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LiveService } from './service';
import { LiveController } from './controller';
import { OddsModule } from '../odds/odds.module';

@Module({
    imports: [HttpModule, OddsModule],
    controllers: [LiveController],
    providers: [LiveService],
    exports: [LiveService],
})
export class LiveModule {}
