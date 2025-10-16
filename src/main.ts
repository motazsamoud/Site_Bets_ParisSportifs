import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('✅ Starting NestJS Server...');

  // 📦 Gestion des payloads volumineux
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.useWebSocketAdapter(new IoAdapter(app));


  // CORS (OK pour images /uploads en GET)

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.56.1:3001',
      'https://site-bets-paris-sportifs-git-frontend-motazsamouds-projects.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true, // important si tu veux envoyer token ou cookies
  });



  // 🌍 Configuration CORS complète
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.56.1:3001',
      'https://site-bets-paris-sportifs.vercel.app',
      'https://site-bets-paris-sportifs-git-frontend-motazsamouds-projects.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
    preflightContinue: false, // ✅ gère automatiquement les preflight requests
    optionsSuccessStatus: 200, // ✅ évite le blocage sur les POST
  });

  // 🧩 Gestion manuelle du preflight OPTIONS (sécurité supplémentaire)
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
      return res.sendStatus(200);
    }
    next();
  });


  // 🖼️ Fichiers statiques /uploads
  const uploadsPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('📁 Serving /uploads from:', uploadsPath);

  // 📘 Swagger
  const config = new DocumentBuilder()
      .setTitle('NestJS API Documentation')
      .setDescription('API endpoints for the project')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 🚀 Lancement du serveur
  const PORT = Number(process.env.PORT) || 3000;
  await app.listen(PORT, '0.0.0.0');

  console.log(`✅ Serveur en cours d'exécution sur http://localhost:${PORT}`);
  console.log(`📘 Swagger disponible sur http://localhost:${PORT}/api`);
  console.log(`🖼️ Images accessibles sur http://localhost:${PORT}/uploads/<fileName>`);
}

bootstrap();
