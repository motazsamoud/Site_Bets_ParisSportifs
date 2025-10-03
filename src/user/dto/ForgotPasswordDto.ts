// src/user/dto/ForgotPasswordDto.ts
import { createZodDto } from '@anatine/zod-nestjs';
import {ForgotPasswordSchema} from "src/user/shemas/forgot-password.schema";

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
