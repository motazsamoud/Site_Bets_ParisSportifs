import { Role } from '../entities/Role.enum';

export class CreateUserDto {
    email: string;
    password?: string;
    username: string;
    dateOfBirth?: Date;
    role: Role;
    status?: string;
}
