// src/user/schemas/forgot-password.schema.ts
import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Please provide a valid email address' }),
});

export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;
