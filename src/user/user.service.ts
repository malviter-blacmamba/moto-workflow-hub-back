import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import type { Role, UserStatus } from "@prisma/client";
import {
    UserCreateDTO,
    UserUpdateDTO,
    UserFilters,
} from "./user.types";

export class UserService {
    static async create(input: UserCreateDTO) {
        const existing = await prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existing) {
            throw new Error("El email ya está registrado");
        }

        const hash = await bcrypt.hash(input.password, 10);

        const user = await prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                password: hash,
                role: (input.role ?? "USER") as Role,
                status: (input.status ?? "ACTIVE") as UserStatus,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    static async getById(id: number) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    static async update(id: number, input: UserUpdateDTO) {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new Error("Usuario no encontrado");
        }

        if (input.email && input.email !== existing.email) {
            const emailUsed = await prisma.user.findUnique({
                where: { email: input.email },
            });
            if (emailUsed) {
                throw new Error("El email ya está en uso por otro usuario");
            }
        }

        let passwordHash: string | undefined;
        if (input.password) {
            passwordHash = await bcrypt.hash(input.password, 10);
        }

        const data: any = {
            name: input.name ?? existing.name,
            email: input.email ?? existing.email,
            role: (input.role ?? existing.role) as Role,
            status: (input.status ?? existing.status) as UserStatus,
        };

        if (passwordHash) {
            data.password = passwordHash;
        }

        const updated = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return updated;
    }

    static async changeStatus(id: number, status: UserStatus) {
        const updated = await prisma.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });

        return updated;
    }

    static async delete(id: number) {
        await prisma.user.delete({ where: { id } });
    }

    static async list(filters: UserFilters) {
        const {
            search = "",
            role,
            status,
            page = 1,
            pageSize = 10,
        } = filters;

        const skip = (page - 1) * pageSize;
        const where: any = {};

        if (role) where.role = role;
        if (status) where.status = status;

        if (search) {
            const clean = search.trim();
            where.OR = [
                { name: { contains: clean } },
                { email: { contains: clean } },
            ];
        }

        const [items, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }
}
