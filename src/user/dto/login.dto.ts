// src/user/dto/login.dto.ts
import { createZodDto } from '@anatine/zod-nestjs';
import {LoginSchema} from "src/user/shemas/login.schema";

export class LoginDto extends createZodDto(LoginSchema) {}
