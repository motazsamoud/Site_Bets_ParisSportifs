import { createZodDto } from 'nestjs-zod';
import {ResetPasswordSchema} from "src/user/shemas/reset-password.schema";

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
