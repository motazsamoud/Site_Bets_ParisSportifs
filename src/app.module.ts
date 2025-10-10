import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { UserController } from './user/user.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './user/jwt-auth/jwt.strategy';
import { OddsModule } from 'src/odds/odds.module';
import { LiveModule } from 'src/live/module';
import { BetsModule } from 'src/bets/bets.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import * as process from "process";

@Module({
  imports: [
    // ✅ Config globale (pour .env et API keys)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ✅ Cache global
    CacheModule.register({
      isGlobal: true,
      ttl: 5,
      max: 100,
    }),

    // ✅ Connexion MongoDB Atlas
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),


    // ✅ Modules de ton app
    HttpModule,
    UserModule,
    AuthModule,
    OddsModule,
    LiveModule,
    WalletModule,
    BetsModule,
  ],

  providers: [AppService, JwtStrategy],
  controllers: [AppController, UserController],
})
export class AppModule {}
