"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class ReminderService {
    static async create(input) {
        const reminder = await prisma_1.default.reminder.create({
            data: {
                clientId: input.clientId,
                motorcycleId: input.motorcycleId,
                serviceId: input.serviceId ?? null,
                targetDate: new Date(input.targetDate),
                channel: input.channel,
                status: (input.status ?? "PENDIENTE"),
                notes: input.notes ?? null,
            },
            include: {
                client: true,
                motorcycle: true,
                service: true,
            },
        });
        return reminder;
    }
    static async getById(id) {
        return prisma_1.default.reminder.findUnique({
            where: { id },
            include: {
                client: true,
                motorcycle: true,
                service: true,
            },
        });
    }
    static async update(id, input) {
        const existing = await prisma_1.default.reminder.findUnique({ where: { id } });
        if (!existing) {
            throw new Error("Recordatorio no encontrado");
        }
        const data = {
            clientId: input.clientId ?? existing.clientId,
            motorcycleId: input.motorcycleId ?? existing.motorcycleId,
            serviceId: input.serviceId !== undefined ? input.serviceId : existing.serviceId,
            channel: (input.channel ?? existing.channel),
            status: (input.status ?? existing.status),
            notes: input.notes !== undefined ? input.notes : existing.notes,
        };
        if (input.targetDate) {
            data.targetDate = new Date(input.targetDate);
        }
        if (input.sentAt !== undefined) {
            data.sentAt = input.sentAt ? new Date(input.sentAt) : null;
        }
        const updated = await prisma_1.default.reminder.update({
            where: { id },
            data,
            include: {
                client: true,
                motorcycle: true,
                service: true,
            },
        });
        return updated;
    }
    static async delete(id) {
        await prisma_1.default.reminder.delete({ where: { id } });
    }
    static async markSent(id) {
        const now = new Date();
        return prisma_1.default.reminder.update({
            where: { id },
            data: {
                status: "ENVIADO",
                sentAt: now,
            },
        });
    }
    static async markCompleted(id) {
        return prisma_1.default.reminder.update({
            where: { id },
            data: {
                status: "COMPLETADO",
            },
        });
    }
    static async list(filters) {
        const { search = "", clientId, motorcycleId, serviceId, channel, status, dateFrom, dateTo, page = 1, pageSize = 10, } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (clientId)
            where.clientId = clientId;
        if (motorcycleId)
            where.motorcycleId = motorcycleId;
        if (serviceId)
            where.serviceId = serviceId;
        if (channel)
            where.channel = channel;
        if (status)
            where.status = status;
        if (dateFrom || dateTo) {
            where.targetDate = {};
            if (dateFrom)
                where.targetDate.gte = new Date(dateFrom);
            if (dateTo)
                where.targetDate.lte = new Date(dateTo);
        }
        if (search) {
            const clean = search.trim();
            where.OR = [
                { client: { name: { contains: clean } } },
                { motorcycle: { brand: { contains: clean } } },
                { motorcycle: { model: { contains: clean } } },
                { service: { name: { contains: clean } } },
            ];
        }
        const [items, total] = await prisma_1.default.$transaction([
            prisma_1.default.reminder.findMany({
                where,
                include: {
                    client: true,
                    motorcycle: true,
                    service: true,
                },
                skip,
                take: pageSize,
                orderBy: {
                    targetDate: "asc",
                },
            }),
            prisma_1.default.reminder.count({ where }),
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
exports.ReminderService = ReminderService;
