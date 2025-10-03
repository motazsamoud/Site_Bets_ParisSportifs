import { z } from 'zod';

export const ResetPasswordSchema = z.object({
    userId: z.string().nonempty('User ID is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
