// src/user/schemas/update-user.schema.ts
import { z } from 'zod';
import { Role } from '../entities/Role.enum';
import { CreateUserSchema } from './create-user.schema';

export const UpdateUserSchema = CreateUserSchema.partial();

export type UpdateUserType = z.infer<typeof UpdateUserSchema>;
