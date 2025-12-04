import prisma from "../lib/prisma";
import {
    ReminderCreateDTO,
    ReminderUpdateDTO,
    ReminderFilters,
    ReminderChannel,
    ReminderStatus,
} from "./reminder.types";

export class ReminderService {
    static async create(input: ReminderCreateDTO) {
        const reminder = await prisma.reminder.create({
            data: {
                clientId: input.clientId,
                motorcycleId: input.motorcycleId,
                serviceId: input.serviceId ?? null,
                targetDate: new Date(input.targetDate),
                channel: input.channel as ReminderChannel,
                status: (input.status ?? "PENDIENTE") as ReminderStatus,
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

    static async getById(id: number) {
        return prisma.reminder.findUnique({
            where: { id },
            include: {
                client: true,
                motorcycle: true,
                service: true,
            },
        });
    }

    static async update(id: number, input: ReminderUpdateDTO) {
        const existing = await prisma.reminder.findUnique({ where: { id } });
        if (!existing) {
            throw new Error("Recordatorio no encontrado");
        }

        const data: any = {
            clientId: input.clientId ?? existing.clientId,
            motorcycleId: input.motorcycleId ?? existing.motorcycleId,
            serviceId:
                input.serviceId !== undefined ? input.serviceId : existing.serviceId,
            channel: (input.channel ?? existing.channel) as ReminderChannel,
            status: (input.status ?? existing.status) as ReminderStatus,
            notes: input.notes !== undefined ? input.notes : existing.notes,
        };

        if (input.targetDate) {
            data.targetDate = new Date(input.targetDate);
        }

        if (input.sentAt !== undefined) {
            data.sentAt = input.sentAt ? new Date(input.sentAt) : null;
        }

        const updated = await prisma.reminder.update({
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

    static async delete(id: number) {
        await prisma.reminder.delete({ where: { id } });
    }

    static async markSent(id: number) {
        const now = new Date();
        return prisma.reminder.update({
            where: { id },
            data: {
                status: "ENVIADO",
                sentAt: now,
            },
        });
    }

    static async markCompleted(id: number) {
        return prisma.reminder.update({
            where: { id },
            data: {
                status: "COMPLETADO",
            },
        });
    }

    static async list(filters: ReminderFilters) {
        const {
            search = "",
            clientId,
            motorcycleId,
            serviceId,
            channel,
            status,
            dateFrom,
            dateTo,
            page = 1,
            pageSize = 10,
        } = filters;

        const skip = (page - 1) * pageSize;
        const where: any = {};

        if (clientId) where.clientId = clientId;
        if (motorcycleId) where.motorcycleId = motorcycleId;
        if (serviceId) where.serviceId = serviceId;
        if (channel) where.channel = channel;
        if (status) where.status = status;

        if (dateFrom || dateTo) {
            where.targetDate = {};
            if (dateFrom) where.targetDate.gte = new Date(dateFrom);
            if (dateTo) where.targetDate.lte = new Date(dateTo);
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

        const [items, total] = await prisma.$transaction([
            prisma.reminder.findMany({
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
            prisma.reminder.count({ where }),
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
