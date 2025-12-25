"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserService {
    static async create(input) {
        const existing = await prisma_1.default.user.findUnique({
            where: { email: input.email },
        });
        if (existing) {
            throw new Error("El email ya está registrado");
        }
        const hash = await bcryptjs_1.default.hash(input.password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                name: input.name,
                email: input.email,
                password: hash,
                role: (input.role ?? "USER"),
                status: (input.status ?? "ACTIVE"),
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
    static async getById(id) {
        return prisma_1.default.user.findUnique({
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
    static async update(id, input) {
        const existing = await prisma_1.default.user.findUnique({ where: { id } });
        if (!existing) {
            throw new Error("Usuario no encontrado");
        }
        if (input.email && input.email !== existing.email) {
            const emailUsed = await prisma_1.default.user.findUnique({
                where: { email: input.email },
            });
            if (emailUsed) {
                throw new Error("El email ya está en uso por otro usuario");
            }
        }
        let passwordHash;
        if (input.password) {
            passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        }
        const data = {
            name: input.name ?? existing.name,
            email: input.email ?? existing.email,
            role: (input.role ?? existing.role),
            status: (input.status ?? existing.status),
        };
        if (passwordHash) {
            data.password = passwordHash;
        }
        const updated = await prisma_1.default.user.update({
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
    static async changeStatus(id, status) {
        const updated = await prisma_1.default.user.update({
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
    static async delete(id) {
        await prisma_1.default.user.delete({ where: { id } });
    }
    static async list(filters) {
        const { search = "", role, status, page = 1, pageSize = 10, } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        if (search) {
            const clean = search.trim();
            where.OR = [
                { name: { contains: clean } },
                { email: { contains: clean } },
            ];
        }
        const [items, total] = await prisma_1.default.$transaction([
            prisma_1.default.user.findMany({
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
            prisma_1.default.user.count({ where }),
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
exports.UserService = UserService;
