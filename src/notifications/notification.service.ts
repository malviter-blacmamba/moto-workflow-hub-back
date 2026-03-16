import prisma from "../lib/prisma";
import type { notification_entity_type, notification_type } from "@prisma/client";
import type { CreateNotificationDTO, NotificationFilters } from "./notification.types";

function normalizePositiveInt(value: unknown, field: string) {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`${field} inválido`);
    }
    return n;
}

function normalizePage(value: unknown, fallback: number) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : fallback;
}

export class NotificationService {
    static async create(input: CreateNotificationDTO) {
        const userId = normalizePositiveInt(input.userId, "userId");

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, status: true },
        });

        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        if (user.status !== "ACTIVE") {
            throw new Error("No se puede crear notificación para un usuario inactivo");
        }

        const title = input.title?.trim();
        const message = input.message?.trim();

        if (!title || !message) {
            throw new Error("Título y mensaje son obligatorios");
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type: input.type as notification_type,
                title,
                message,
                entityType: (input.entityType ?? null) as notification_entity_type | null,
                entityId: input.entityId ?? null,
            },
        });

        return notification;
    }

    static async createIfNotExists(input: CreateNotificationDTO) {
        const userId = normalizePositiveInt(input.userId, "userId");

        const title = input.title?.trim();
        const message = input.message?.trim();

        if (!title || !message) {
            throw new Error("Título y mensaje son obligatorios");
        }

        const existing = await prisma.notification.findFirst({
            where: {
                userId,
                type: input.type as notification_type,
                entityType: (input.entityType ?? null) as notification_entity_type | null,
                entityId: input.entityId ?? null,
            },
            select: { id: true },
        });

        if (existing) {
            return existing;
        }

        return prisma.notification.create({
            data: {
                userId,
                type: input.type as notification_type,
                title,
                message,
                entityType: (input.entityType ?? null) as notification_entity_type | null,
                entityId: input.entityId ?? null,
            },
        });
    }

    static async listByUser(userId: number, filters: NotificationFilters) {
        const safeUserId = normalizePositiveInt(userId, "userId");
        const page = normalizePage(filters.page, 1);
        const pageSize = normalizePage(filters.pageSize, 20);
        const skip = (page - 1) * pageSize;

        const where: {
            userId: number;
            isRead?: boolean;
        } = {
            userId: safeUserId,
        };

        if (typeof filters.isRead === "boolean") {
            where.isRead = filters.isRead;
        }

        const [items, total, unreadCount] = await prisma.$transaction([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: {
                    userId: safeUserId,
                    isRead: false,
                },
            }),
        ]);

        return {
            items,
            total,
            unreadCount,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    static async markAsRead(id: number, userId: number) {
        const notificationId = normalizePositiveInt(id, "id");
        const safeUserId = normalizePositiveInt(userId, "userId");

        const existing = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: safeUserId,
            },
            select: { id: true },
        });

        if (!existing) {
            throw new Error("Notificación no encontrada");
        }

        return prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    static async markAllAsRead(userId: number) {
        const safeUserId = normalizePositiveInt(userId, "userId");

        await prisma.notification.updateMany({
            where: {
                userId: safeUserId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return { success: true };
    }

    static async remove(id: number, userId: number) {
        const notificationId = normalizePositiveInt(id, "id");
        const safeUserId = normalizePositiveInt(userId, "userId");

        const existing = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: safeUserId,
            },
            select: { id: true },
        });

        if (!existing) {
            throw new Error("Notificación no encontrada");
        }

        await prisma.notification.delete({
            where: { id: notificationId },
        });

        return { success: true };
    }
}