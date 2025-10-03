// src/user/dto/create-user.dto.ts
import { createZodDto } from '@anatine/zod-nestjs';
import {CreateUserSchema} from "src/user/shemas/create-user.schema";

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
