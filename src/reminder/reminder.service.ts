import prisma from "../lib/prisma";
import type { reminder_channel, reminder_status } from "@prisma/client";
import {
    ReminderCreateDTO,
    ReminderUpdateDTO,
    ReminderFilters,
} from "./reminder.types";

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

function parseDate(value: string | Date, field: string) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${field} inválido`);
    }
    return date;
}

async function validateReminderRelations(
    clientId: number,
    motorcycleId: number,
    serviceId: number
) {
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true },
    });

    if (!client) {
        throw new Error("Cliente no encontrado");
    }

    const motorcycle = await prisma.motorcycle.findUnique({
        where: { id: motorcycleId },
        select: {
            id: true,
            clientId: true,
            type: true,
            brand: true,
            model: true,
            plate: true,
        },
    });

    if (!motorcycle) {
        throw new Error("Vehículo no encontrado");
    }

    if (motorcycle.clientId !== clientId) {
        throw new Error("El vehículo no pertenece al cliente seleccionado");
    }

    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: {
            id: true,
            name: true,
            vehicleType: true,
        },
    });

    if (!service) {
        throw new Error("Servicio no encontrado");
    }

    if (service.vehicleType !== motorcycle.type && service.vehicleType !== "BOTH") {
        throw new Error(
            "El servicio no corresponde al tipo de vehículo del recordatorio"
        );
    }
}

export class ReminderService {
    static async create(input: ReminderCreateDTO) {
        const clientId = normalizePositiveInt(input.clientId, "clientId");
        const motorcycleId = normalizePositiveInt(input.motorcycleId, "motorcycleId");

        if (!input.serviceId) {
            throw new Error("serviceId es obligatorio para agendar un mantenimiento");
        }
        const serviceId = normalizePositiveInt(input.serviceId, "serviceId");

        if (!input.channel || !["WHATSAPP", "EMAIL", "PHONE"].includes(input.channel)) {
            throw new Error("Canal inválido");
        }

        await validateReminderRelations(clientId, motorcycleId, serviceId);

        const reminder = await prisma.reminder.create({
            data: {
                clientId,
                motorcycleId,
                serviceId,
                targetDate: parseDate(input.targetDate, "targetDate"),
                channel: input.channel,
                status: input.status ?? "PENDIENTE",
                notes: input.notes?.trim() || null,
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
        const reminderId = normalizePositiveInt(id, "id");

        return prisma.reminder.findUnique({
            where: { id: reminderId },
            include: {
                client: true,
                motorcycle: true,
                service: true,
            },
        });
    }

    static async update(id: number, input: ReminderUpdateDTO) {
        const reminderId = normalizePositiveInt(id, "id");

        const existing = await prisma.reminder.findUnique({
            where: { id: reminderId },
        });

        if (!existing) {
            throw new Error("Recordatorio no encontrado");
        }

        const nextClientId =
            input.clientId !== undefined
                ? normalizePositiveInt(input.clientId, "clientId")
                : existing.clientId;

        const nextMotorcycleId =
            input.motorcycleId !== undefined
                ? normalizePositiveInt(input.motorcycleId, "motorcycleId")
                : existing.motorcycleId;

        const nextServiceId =
            input.serviceId !== undefined
                ? normalizePositiveInt(input.serviceId, "serviceId")
                : existing.serviceId;

        if (!nextServiceId) {
            throw new Error("El recordatorio debe tener un servicio asignado");
        }

        const nextChannel = input.channel ?? existing.channel;
        const nextStatus = input.status ?? existing.status;

        if (!["WHATSAPP", "EMAIL", "PHONE"].includes(nextChannel)) {
            throw new Error("Canal inválido");
        }

        if (!["PENDIENTE", "ENVIADO", "COMPLETADO"].includes(nextStatus)) {
            throw new Error("Estado inválido");
        }

        await validateReminderRelations(nextClientId, nextMotorcycleId, nextServiceId);

        const data: {
            clientId: number;
            motorcycleId: number;
            serviceId: number;
            targetDate?: Date;
            channel: reminder_channel;
            status: reminder_status;
            sentAt?: Date | null;
            notes: string | null;
        } = {
            clientId: nextClientId,
            motorcycleId: nextMotorcycleId,
            serviceId: nextServiceId,
            channel: nextChannel,
            status: nextStatus,
            notes: input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
        };

        if (input.targetDate !== undefined) {
            data.targetDate = parseDate(input.targetDate, "targetDate");
        }

        if (input.sentAt !== undefined) {
            data.sentAt = input.sentAt ? parseDate(input.sentAt, "sentAt") : null;
        }

        if (nextStatus === "PENDIENTE" && input.sentAt === undefined) {
            data.sentAt = null;
        }

        const updated = await prisma.reminder.update({
            where: { id: reminderId },
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
        const reminderId = normalizePositiveInt(id, "id");

        const existing = await prisma.reminder.findUnique({
            where: { id: reminderId },
            select: { id: true },
        });

        if (!existing) {
            throw new Error("Recordatorio no encontrado");
        }

        await prisma.reminder.delete({ where: { id: reminderId } });
    }

    static async markSent(id: number) {
        const reminderId = normalizePositiveInt(id, "id");

        const existing = await prisma.reminder.findUnique({
            where: { id: reminderId },
            select: {
                id: true,
                status: true,
            },
        });

        if (!existing) {
            throw new Error("Recordatorio no encontrado");
        }

        if (existing.status === "COMPLETADO") {
            throw new Error("No se puede marcar como enviado un recordatorio completado");
        }

        const now = new Date();

        return prisma.reminder.update({
            where: { id: reminderId },
            data: {
                status: "ENVIADO",
                sentAt: now,
            },
            include: {
                client: true,
                motorcycle: true,
                service: true,
            },
        });
    }

    static async markCompleted(id: number) {
        const reminderId = normalizePositiveInt(id, "id");

        const existing = await prisma.reminder.findUnique({
            where: { id: reminderId },
            select: {
                id: true,
                status: true,
            },
        });

        if (!existing) {
            throw new Error("Recordatorio no encontrado");
        }

        return prisma.reminder.update({
            where: { id: reminderId },
            data: {
                status: "COMPLETADO",
            },
            include: {
                client: true,
                motorcycle: true,
                service: true,
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

        const currentPage = normalizePage(page, 1);
        const currentPageSize = normalizePage(pageSize, 10);
        const skip = (currentPage - 1) * currentPageSize;
        const clean = search.trim();

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

        if (clean) {
            where.OR = [
                { client: { is: { name: { contains: clean } } } },
                { motorcycle: { is: { brand: { contains: clean } } } },
                { motorcycle: { is: { model: { contains: clean } } } },
                { motorcycle: { is: { plate: { contains: clean } } } },
                { service: { is: { name: { contains: clean } } } },
                { notes: { contains: clean } },
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
                take: currentPageSize,
                orderBy: {
                    targetDate: "asc",
                },
            }),
            prisma.reminder.count({ where }),
        ]);

        return {
            items,
            total,
            page: currentPage,
            pageSize: currentPageSize,
            totalPages: Math.ceil(total / currentPageSize),
        };
    }
}