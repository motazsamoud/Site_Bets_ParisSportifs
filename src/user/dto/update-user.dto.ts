// src/user/dto/update-user.dto.ts
import { createZodDto } from '@anatine/zod-nestjs';
import {UpdateUserSchema} from "src/user/shemas/update-user.schema";

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
