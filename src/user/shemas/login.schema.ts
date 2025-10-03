// src/user/schemas/login.schema.ts
import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email({ message: 'Please provide a valid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

export type LoginType = z.infer<typeof LoginSchema>;
