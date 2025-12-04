import type { Role, UserStatus } from "@prisma/client";

export interface UserFilters {
    search?: string;
    role?: Role;
    status?: UserStatus;
    page?: number;
    pageSize?: number;
}

export interface UserCreateDTO {
    name: string;
    email: string;
    password: string;
    role?: Role;
    status?: UserStatus;
}

export interface UserUpdateDTO {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    status?: UserStatus;
}
