import prisma from "../lib/prisma";
import type { Prisma } from "@prisma/client";
import { workorder_status } from "@prisma/client";
import {
    DashboardSummaryFilters,
    TopServicesFilters,
} from "./report.types";

export class ReportService {
    static async getDashboardSummary(filters: DashboardSummaryFilters) {
        const where: Prisma.workorderWhereInput = {
            status: workorder_status.ENTREGADO,
        };

        if (filters.dateFrom || filters.dateTo) {
            where.date = {};
            if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
            if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
        }

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
                        status: true,
                    },
                }),
                prisma.client.count(),
                prisma.motorcycle.count(),
            ]);

        const totalRevenue = Number(agg._sum.total ?? 0);
        const avgTicket = Number(agg._avg.total ?? 0);
        const totalClosedOrders = Number(agg._count ?? 0);
        const uniqueClients = new Set(deliveredOrders.map((item) => item.clientId)).size;

        return {
            totalRevenue,
            avgTicket,
            totalClosedOrders,
            totalClients: clientsCount,
            totalMotorcycles: motorcyclesCount,
            attendedClients: uniqueClients,
            dateRange: {
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            },
        };
    }

    static async getTopServices(filters: TopServicesFilters) {
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 5;

        const workorderWhere: Prisma.workorderWhereInput = {
            status: workorder_status.ENTREGADO,
        };

        if (filters.dateFrom || filters.dateTo) {
            workorderWhere.date = {};
            if (filters.dateFrom) workorderWhere.date.gte = new Date(filters.dateFrom);
            if (filters.dateTo) workorderWhere.date.lte = new Date(filters.dateTo);
        }

        const group = await prisma.workorderserviceitem.groupBy({
            by: ["serviceId"],
            _sum: { total: true },
            _count: { _all: true },
            where: Object.keys(workorderWhere).length
                ? {
                    workorder: {
                        is: workorderWhere,
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
}