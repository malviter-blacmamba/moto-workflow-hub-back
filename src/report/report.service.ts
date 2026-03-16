import prisma from "../lib/prisma";
import type { Prisma } from "@prisma/client";
import { workorder_status } from "@prisma/client";
import {
    DashboardSummaryFilters,
    TopServicesFilters,
    TopExtraItemsFilters,
} from "./report.types";

function parseDate(value: string | undefined, field: string, isEndOfDay = false) {
    if (!value) return undefined;
    const dateStr = isEndOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${field} inválido`);
    }
    return date;
}

function normalizeLimit(limit: number | undefined, fallback = 5) {
    return Number.isInteger(limit) && (limit ?? 0) > 0 ? Number(limit) : fallback;
}

function buildDeliveredWhere(filters: DashboardSummaryFilters): Prisma.workorderWhereInput {
    const where: Prisma.workorderWhereInput = {
        status: workorder_status.ENTREGADO,
    };

    const dateFrom = parseDate(filters.dateFrom, "dateFrom");
    const dateTo = parseDate(filters.dateTo, "dateTo", true);

    if (dateFrom && dateTo && dateFrom > dateTo) {
        throw new Error("dateFrom no puede ser mayor que dateTo");
    }

    if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = dateFrom;
        if (dateTo) where.date.lte = dateTo;
    }

    return where;
}

export class ReportService {
    static async getDashboardSummary(filters: DashboardSummaryFilters) {
        const where = buildDeliveredWhere(filters);

        const [agg, deliveredOrders, clientsCount, motorcyclesCount] =
            await prisma.$transaction([
                prisma.workorder.aggregate({
                    _sum: { total: true },
                    _avg: { total: true },
                    _count: true,
                    where,
                }),
                prisma.workorder.findMany({
                    where,
                    select: {
                        id: true,
                        clientId: true,
                        date: true,
                        total: true,
                    },
                    orderBy: {
                        date: "asc",
                    },
                }),
                prisma.client.count(),
                prisma.motorcycle.count(),
            ]);

        const totalRevenue = Number(agg._sum.total ?? 0);
        const avgTicket = Number(agg._avg.total ?? 0);
        const totalClosedOrders = Number(agg._count ?? 0);
        const attendedClients = new Set(deliveredOrders.map((item) => item.clientId)).size;

        const clientFirstOrders = await prisma.workorder.groupBy({
            by: ["clientId"],
            where: {
                status: workorder_status.ENTREGADO,
            },
            _min: {
                date: true,
            },
        });

        const firstOrderMap = new Map(
            clientFirstOrders.map((item) => [item.clientId, item._min.date])
        );

        let newClients = 0;
        let recurrentClients = 0;

        const uniqueDeliveredClients = [...new Set(deliveredOrders.map((item) => item.clientId))];

        for (const clientId of uniqueDeliveredClients) {
            const firstDate = firstOrderMap.get(clientId);
            const deliveredInRange = deliveredOrders.some((item) => item.clientId === clientId);

            if (!deliveredInRange || !firstDate) continue;

            const hasPreviousDelivered = firstDate < deliveredOrders.find((item) => item.clientId === clientId)!.date;

            if (hasPreviousDelivered) {
                recurrentClients += 1;
            } else {
                newClients += 1;
            }
        }

        // Lógica para la gráfica de ventas
        const groupingType = filters.groupBy || "day";
        const salesMap = new Map<string, number>();

        deliveredOrders.forEach((order) => {
            const d = order.date;
            let key = "";

            if (groupingType === "day") {
                key = d.toISOString().split("T")[0];
            } else if (groupingType === "month") {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            } else if (groupingType === "week") {
                // Cálculo simple de semana ISO
                const dCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                dCopy.setUTCDate(dCopy.getUTCDate() + 4 - (dCopy.getUTCDay() || 7));
                const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(), 0, 1));
                const weekNo = Math.ceil((((dCopy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                key = `${dCopy.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
            }

            salesMap.set(key, (salesMap.get(key) || 0) + Number(order.total));
        });

        const salesByPeriod = Array.from(salesMap.entries()).map(([period, total]) => ({
            period,
            total
        }));

        const topServices = await this.getTopServices({
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            limit: 5,
        });

        const topExtraItems = await this.getTopExtraItems({
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            limit: 5,
        });

        return {
            totalRevenue,
            avgTicket,
            totalClosedOrders,
            totalClients: clientsCount,
            totalMotorcycles: motorcyclesCount,
            attendedClients,
            recurrence: {
                newClients,
                recurrentClients,
            },
            salesByPeriod, // Arreglo para dibujar la gráfica
            topServices: topServices.items,
            topExtraItems: topExtraItems.items,
            dateRange: {
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            },
        };
    }

    static async getTopServices(filters: TopServicesFilters) {
        const limit = normalizeLimit(filters.limit, 5);
        const workorderWhere = buildDeliveredWhere(filters);

        const group = await prisma.workorderserviceitem.groupBy({
            by: ["serviceId"],
            _sum: { total: true },
            _count: { _all: true },
            where: {
                workorder: {
                    is: workorderWhere,
                },
            },
            orderBy: {
                _sum: {
                    total: "desc",
                },
            },
            take: limit,
        });

        const serviceIds = group.map((g) => g.serviceId);

        const services = await prisma.service.findMany({
            where: { id: { in: serviceIds } },
            select: {
                id: true,
                name: true,
            },
        });

        const serviceMap = new Map(services.map((s) => [s.id, s.name]));

        const items = group.map((g) => ({
            serviceId: g.serviceId,
            serviceName: serviceMap.get(g.serviceId) ?? "Servicio",
            timesSold: g._count._all ?? 0,
            revenue: Number(g._sum.total ?? 0),
        }));

        return {
            items,
            dateRange: {
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            },
        };
    }

    static async getTopExtraItems(filters: TopExtraItemsFilters) {
        const limit = normalizeLimit(filters.limit, 5);
        const workorderWhere = buildDeliveredWhere(filters);

        const items = await prisma.workorderextraitem.findMany({
            where: {
                workorder: {
                    is: workorderWhere,
                },
            },
            select: {
                name: true,
                quantity: true,
                total: true,
            },
        });

        const grouped = new Map<
            string,
            { itemName: string; timesSold: number; quantitySold: number; revenue: number }
        >();

        for (const item of items) {
            const key = item.name.trim().toLowerCase();
            const existing = grouped.get(key);

            if (existing) {
                existing.timesSold += 1;
                existing.quantitySold += item.quantity;
                existing.revenue += Number(item.total);
            } else {
                grouped.set(key, {
                    itemName: item.name,
                    timesSold: 1,
                    quantitySold: item.quantity,
                    revenue: Number(item.total),
                });
            }
        }

        const ranked = [...grouped.values()]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

        return {
            items: ranked,
            dateRange: {
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            },
        };
    }
}