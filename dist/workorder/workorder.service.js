"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function generateWorkOrderCode(tx) {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    const count = await tx.workOrder.count({
        where: {
            date: {
                gte: startOfYear,
                lte: endOfYear,
            },
        },
    });
    const next = count + 1;
    const seq = String(next).padStart(3, "0");
    return `OT-${year}-${seq}`;
}
async function buildServiceItems(tx, items) {
    const result = [];
    let subtotal = 0;
    if (!items || items.length === 0) {
        return { result, subtotal };
    }
    for (const item of items) {
        const service = await tx.service.findUnique({
            where: { id: item.serviceId },
        });
        if (!service) {
            throw new Error(`Servicio no encontrado (id: ${item.serviceId})`);
        }
        const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
        const unitPrice = typeof item.unitPrice === "number"
            ? item.unitPrice
            : Number(service.basePrice);
        const total = unitPrice * quantity;
        subtotal += total;
        result.push({
            serviceId: item.serviceId,
            quantity,
            unitPrice,
            total,
        });
    }
    return { result, subtotal };
}
function buildExtraItems(items) {
    const result = [];
    let subtotal = 0;
    if (!items || items.length === 0) {
        return { result, subtotal };
    }
    for (const item of items) {
        const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
        const unitPrice = item.unitPrice;
        const total = unitPrice * quantity;
        subtotal += total;
        result.push({
            name: item.name,
            quantity,
            unitPrice,
            total,
        });
    }
    return { result, subtotal };
}
function buildItemsFromUnified(items) {
    const serviceItems = [];
    const extraItems = [];
    let subtotal = 0;
    if (!items || items.length === 0) {
        return { serviceItems, extraItems, subtotal };
    }
    for (const item of items) {
        const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
        const unitPrice = item.unitPrice;
        const discount = item.discount ?? 0;
        const total = quantity * unitPrice - discount;
        subtotal += total;
        if (item.type === "SERVICE") {
            if (!item.serviceId) {
                throw new Error("serviceId requerido para items de tipo SERVICE");
            }
            serviceItems.push({
                serviceId: item.serviceId,
                quantity,
                unitPrice,
                total,
            });
        }
        else {
            extraItems.push({
                name: item.description,
                quantity,
                unitPrice,
                total,
            });
        }
    }
    return { serviceItems, extraItems, subtotal };
}
class WorkOrderService {
    static async create(input) {
        return prisma_1.default.$transaction(async (tx) => {
            const code = await generateWorkOrderCode(tx);
            let servicesInput = input.services ?? [];
            let extraItemsInput = input.extraItems ?? [];
            if (servicesInput.length === 0 &&
                extraItemsInput.length === 0 &&
                input.items &&
                input.items.length > 0) {
                for (const item of input.items) {
                    if (item.type === "SERVICE" && item.serviceId) {
                        servicesInput.push({
                            serviceId: item.serviceId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        });
                    }
                    else if (item.type === "PART") {
                        extraItemsInput.push({
                            name: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        });
                    }
                }
            }
            const { result: serviceItems, subtotal: servicesSubtotal } = await buildServiceItems(tx, servicesInput);
            const { result: extraItems, subtotal: extrasSubtotal } = buildExtraItems(extraItemsInput);
            const subtotal = servicesSubtotal + extrasSubtotal;
            const total = subtotal;
            const workOrder = await tx.workOrder.create({
                data: {
                    code,
                    clientId: input.clientId,
                    motorcycleId: input.motorcycleId,
                    status: (input.status ?? "INGRESADO"),
                    notes: input.notes ?? null,
                    date: input.date ? new Date(input.date) : new Date(),
                    subtotal,
                    total,
                    services: {
                        create: serviceItems,
                    },
                    extraItems: {
                        create: extraItems,
                    },
                },
                include: {
                    client: true,
                    motorcycle: true,
                    services: {
                        include: { service: true },
                    },
                    extraItems: true,
                },
            });
            return workOrder;
        });
    }
    static async getById(id) {
        return prisma_1.default.workOrder.findUnique({
            where: { id },
            include: {
                client: true,
                motorcycle: true,
                services: {
                    include: { service: true },
                },
                extraItems: true,
            },
        });
    }
    static async update(id, input) {
        return prisma_1.default.$transaction(async (tx) => {
            const existing = await tx.workOrder.findUnique({
                where: { id },
                include: {
                    services: true,
                    extraItems: true,
                },
            });
            if (!existing) {
                throw new Error("Orden de trabajo no encontrada");
            }
            let serviceItemsData = existing.services;
            let extraItemsData = existing.extraItems;
            if (input.items && input.items.length > 0) {
                const built = buildItemsFromUnified(input.items);
                serviceItemsData = built.serviceItems;
                extraItemsData = built.extraItems;
            }
            else {
                if (input.services) {
                    const built = await buildServiceItems(tx, input.services);
                    serviceItemsData = built.result;
                }
                if (input.extraItems) {
                    const built = buildExtraItems(input.extraItems);
                    extraItemsData = built.result;
                }
            }
            const servicesSubtotal = serviceItemsData.reduce((sum, it) => sum + Number(it.total), 0);
            const extrasSubtotal = extraItemsData.reduce((sum, it) => sum + Number(it.total), 0);
            const subtotal = servicesSubtotal + extrasSubtotal;
            const total = subtotal;
            if (input.items && input.items.length > 0) {
                await tx.workOrderServiceItem.deleteMany({ where: { workOrderId: id } });
                await tx.workOrderExtraItem.deleteMany({ where: { workOrderId: id } });
            }
            else {
                if (input.services) {
                    await tx.workOrderServiceItem.deleteMany({ where: { workOrderId: id } });
                }
                if (input.extraItems) {
                    await tx.workOrderExtraItem.deleteMany({ where: { workOrderId: id } });
                }
            }
            const updated = await tx.workOrder.update({
                where: { id },
                data: {
                    clientId: input.clientId ?? existing.clientId,
                    motorcycleId: input.motorcycleId ?? existing.motorcycleId,
                    notes: input.notes !== undefined ? input.notes : existing.notes,
                    status: (input.status ?? existing.status),
                    date: input.date ? new Date(input.date) : existing.date,
                    subtotal,
                    total,
                    ...(serviceItemsData.length > 0 && {
                        services: { create: serviceItemsData },
                    }),
                    ...(extraItemsData.length > 0 && {
                        extraItems: { create: extraItemsData },
                    }),
                },
                include: {
                    client: true,
                    motorcycle: true,
                    services: { include: { service: true } },
                    extraItems: true,
                },
            });
            return updated;
        });
    }
    static async changeStatus(id, status) {
        return prisma_1.default.workOrder.update({
            where: { id },
            data: { status },
        });
    }
    static async delete(id) {
        return prisma_1.default.$transaction(async (tx) => {
            await tx.workOrderServiceItem.deleteMany({ where: { workOrderId: id } });
            await tx.workOrderExtraItem.deleteMany({ where: { workOrderId: id } });
            await tx.workOrder.delete({ where: { id } });
        });
    }
    static async list(filters) {
        const { search = "", status, clientId, motorcycleId, dateFrom, dateTo, page = 1, pageSize = 10, } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (status)
            where.status = status;
        if (clientId)
            where.clientId = clientId;
        if (motorcycleId)
            where.motorcycleId = motorcycleId;
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom)
                where.date.gte = new Date(dateFrom);
            if (dateTo)
                where.date.lte = new Date(dateTo);
        }
        if (search) {
            const clean = search.trim();
            where.OR = [
                { code: { contains: clean } },
                { client: { name: { contains: clean } } },
            ];
        }
        const [items, total] = await prisma_1.default.$transaction([
            prisma_1.default.workOrder.findMany({
                where,
                include: {
                    client: true,
                    motorcycle: true,
                    services: { include: { service: true } },
                    extraItems: true,
                },
                skip,
                take: pageSize,
                orderBy: { date: "desc" },
            }),
            prisma_1.default.workOrder.count({ where }),
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
exports.WorkOrderService = WorkOrderService;
