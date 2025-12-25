"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class ReportService {
    static async getDashboardSummary(filters) {
        const where = {};
        if (filters.dateFrom || filters.dateTo) {
            where.date = {};
            if (filters.dateFrom)
                where.date.gte = new Date(filters.dateFrom);
            if (filters.dateTo)
                where.date.lte = new Date(filters.dateTo);
        }
        const [agg, statusGroups, clientsCount, motorcyclesCount] = await prisma_1.default.$transaction([
            prisma_1.default.workOrder.aggregate({
                _sum: { total: true },
                _avg: { total: true },
                _count: true,
                where,
            }),
            prisma_1.default.workOrder.groupBy({
                by: ["status"],
                _count: { _all: true },
                where,
                orderBy: {
                    status: "asc",
                },
            }),
            prisma_1.default.client.count(),
            prisma_1.default.motorcycle.count(),
        ]);
        const totalRevenue = Number(agg._sum.total ?? 0);
        const avgTicket = Number(agg._avg.total ?? 0);
        const totalWorkOrders = Number(agg._count ?? 0);
        const statusCounts = {};
        for (const row of statusGroups) {
            const countAll = typeof row._count === "object" && row._count !== null
                ? row._count._all ?? 0
                : 0;
            statusCounts[row.status] = countAll;
        }
        return {
            totalRevenue,
            avgTicket,
            totalWorkOrders,
            totalClients: clientsCount,
            totalMotorcycles: motorcyclesCount,
            statusCounts,
            dateRange: {
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            },
        };
    }
    static async getTopServices(filters) {
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 5;
        const whereWO = {};
        if (filters.dateFrom || filters.dateTo) {
            whereWO.date = {};
            if (filters.dateFrom)
                whereWO.date.gte = new Date(filters.dateFrom);
            if (filters.dateTo)
                whereWO.date.lte = new Date(filters.dateTo);
        }
        const group = await prisma_1.default.workOrderServiceItem.groupBy({
            by: ["serviceId"],
            _sum: { total: true },
            _count: { _all: true },
            where: Object.keys(whereWO).length
                ? {
                    workOrder: {
                        is: whereWO,
                    },
                }
                : undefined,
            orderBy: {
                _sum: {
                    total: "desc",
                },
            },
            take: limit,
        });
        const serviceIds = group.map((g) => g.serviceId);
        const services = await prisma_1.default.service.findMany({
            where: { id: { in: serviceIds } },
        });
        const serviceMap = new Map(services.map((s) => [s.id, s]));
        const items = group.map((g) => {
            const service = serviceMap.get(g.serviceId);
            return {
                serviceId: g.serviceId,
                serviceName: service?.name ?? "Servicio",
                timesSold: typeof g._count === "object" && g._count !== null
                    ? g._count._all ?? 0
                    : 0,
                revenue: typeof g._sum === "object" && g._sum !== null
                    ? Number(g._sum.total ?? 0)
                    : 0,
            };
        });
        return {
            items,
            dateRange: {
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            },
        };
    }
}
exports.ReportService = ReportService;
