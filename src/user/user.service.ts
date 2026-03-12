import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import type { user_role, user_status } from "@prisma/client";
import { UserCreateDTO, UserUpdateDTO, UserFilters } from "./user.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserService {
    static async create(input: UserCreateDTO) {
        const name = input.name?.trim();
        const email = input.email?.toLowerCase().trim();
        const password = input.password?.trim();
        const role = (input.role ?? "USER") as user_role;
        const status = (input.status ?? "ACTIVE") as user_status;

        if (!name || !email || !password) {
            throw new Error("Nombre, email y contraseña son obligatorios");
        }

        if (!EMAIL_REGEX.test(email)) {
            throw new Error("Email no válido");
        }

        if (password.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres");
        }

        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            throw new Error("El email ya está registrado");
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hash,
                role,
                status,
            },
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

        return user;
    }

    static async getById(id: number) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("ID de usuario inválido");
        }

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
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("ID de usuario inválido");
        }

        const existing = await prisma.user.findUnique({ where: { id } });

        if (!existing) {
            throw new Error("Usuario no encontrado");
        }

        const nextName = input.name?.trim() ?? existing.name;
        const nextEmail = input.email?.toLowerCase().trim() ?? existing.email;
        const nextRole = (input.role ?? existing.role) as user_role;
        const nextStatus = (input.status ?? existing.status) as user_status;

        if (!nextName || !nextEmail) {
            throw new Error("Nombre y email son obligatorios");
        }

        if (!EMAIL_REGEX.test(nextEmail)) {
            throw new Error("Email no válido");
        }

        if (nextEmail !== existing.email) {
            const emailUsed = await prisma.user.findUnique({
                where: { email: nextEmail },
            });

            if (emailUsed) {
                throw new Error("El email ya está en uso por otro usuario");
            }
        }

        const data: {
            name: string;
            email: string;
            role: user_role;
            status: user_status;
            password?: string;
        } = {
            name: nextName,
            email: nextEmail,
            role: nextRole,
            status: nextStatus,
        };

        if (input.password?.trim()) {
            if (input.password.trim().length < 6) {
                throw new Error("La contraseña debe tener al menos 6 caracteres");
            }

            data.password = await bcrypt.hash(input.password.trim(), 10);
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

    static async changeStatus(id: number, status: user_status) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("ID de usuario inválido");
        }

        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            throw new Error("Estado de usuario inválido");
        }

        const existing = await prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            throw new Error("Usuario no encontrado");
        }

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
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("ID de usuario inválido");
        }

        const existing = await prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            throw new Error("Usuario no encontrado");
        }

        await prisma.user.delete({ where: { id } });
    }

    static async list(filters: UserFilters) {
        const search = filters.search?.trim() ?? "";
        const role = filters.role;
        const status = filters.status;
        const page = Number.isFinite(filters.page) && (filters.page ?? 0) > 0 ? Number(filters.page) : 1;
        const pageSize =
            Number.isFinite(filters.pageSize) && (filters.pageSize ?? 0) > 0
                ? Number(filters.pageSize)
                : 10;

        const skip = (page - 1) * pageSize;

        const where: {
            role?: user_role;
            status?: user_status;
            OR?: Array<{
                name?: { contains: string };
                email?: { contains: string };
            }>;
        } = {};

        if (role) where.role = role as user_role;
        if (status) where.status = status as user_status;

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
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