import { z } from 'zod';
import { Role } from '../entities/Role.enum';

export const CreateUserSchema = z.object({
    email: z.string().email({ message: 'Please provide a valid email address' }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .optional(),  // 🔥 devient optionnel
    username: z.string().min(1, { message: 'Name is required' }),
    dateOfBirth: z
        .string()
        .datetime({ message: 'Birthdate must be a valid date in ISO 8601 format' })
        .optional(),  // 🔥 devient optionnel
    role: z.nativeEnum(Role, {
        errorMap: () => ({ message: 'Invalid role selected' }),
    }),
    status: z.string().default('not verified'),
});


export type CreateUserType = z.infer<typeof CreateUserSchema>;
