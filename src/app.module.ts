import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { UserController } from './user/user.controller';

import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './user/jwt-auth/jwt.strategy';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ⬅️ très important pour éviter l'import dans chaque module
    }),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/StageEte2025_2026'),
    UserModule,
    AuthModule,



  ],
  providers: [AppService,JwtStrategy], // 🚫 SUPPRIMER AvatarService ici
  controllers: [AppController, UserController,],
})
export class AppModule {}
