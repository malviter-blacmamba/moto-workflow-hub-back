import prisma from "../lib/prisma";
import type { GlobalSearchFilters, SearchResultItem } from "./search.types";

function normalizeLimit(value: number | undefined, fallback = 5, max = 20) {
    if (!Number.isInteger(value) || (value ?? 0) <= 0) return fallback;
    return Math.min(Number(value), max);
}

export class SearchService {
    static async globalSearch(filters: GlobalSearchFilters) {
        const q = filters.q?.trim();

        if (!q || q.length < 2) {
            return {
                query: q ?? "",
                items: [] as SearchResultItem[],
            };
        }

        const limit = normalizeLimit(filters.limit, 5, 20);

        const [clients, motorcycles, workorders] = await Promise.all([
            prisma.client.findMany({
                where: {
                    OR: [
                        { name: { contains: q } },
                        { phone: { contains: q } },
                        { email: { contains: q } },
                        { address: { contains: q } },
                    ],
                },
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    membership: true,
                },
            }),
            prisma.motorcycle.findMany({
                where: {
                    OR: [
                        { brand: { contains: q } },
                        { model: { contains: q } },
                        { plate: { contains: q } },
                        { vin: { contains: q } },
                        { client: { is: { name: { contains: q } } } },
                    ],
                },
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    brand: true,
                    model: true,
                    plate: true,
                    vin: true,
                    type: true,
                    client: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.workorder.findMany({
                where: {
                    OR: [
                        { code: { contains: q } },
                        { notes: { contains: q } },
                        { client: { is: { name: { contains: q } } } },
                        { motorcycle: { is: { brand: { contains: q } } } },
                        { motorcycle: { is: { model: { contains: q } } } },
                        { motorcycle: { is: { plate: { contains: q } } } },
                        { motorcycle: { is: { vin: { contains: q } } } },
                    ],
                },
                take: limit,
                orderBy: { date: "desc" },
                select: {
                    id: true,
                    code: true,
                    status: true,
                    total: true,
                    date: true,
                    client: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    motorcycle: {
                        select: {
                            id: true,
                            brand: true,
                            model: true,
                            plate: true,
                            type: true,
                        },
                    },
                },
            }),
        ]);

        const items: SearchResultItem[] = [
            ...clients.map((item) => ({
                type: "CLIENT" as const,
                id: item.id,
                title: item.name,
                subtitle: item.phone || item.email || null,
                meta: {
                    membership: item.membership,
                    email: item.email,
                    phone: item.phone,
                },
            })),
            ...motorcycles.map((item) => ({
                type: "MOTORCYCLE" as const,
                id: item.id,
                title: `${item.brand} ${item.model}`,
                subtitle: item.plate || item.vin || null,
                meta: {
                    type: item.type,
                    clientId: item.client.id,
                    clientName: item.client.name,
                    plate: item.plate,
                    vin: item.vin,
                },
            })),
            ...workorders.map((item) => ({
                type: "WORKORDER" as const,
                id: item.id,
                title: item.code,
                subtitle: `${item.client.name} • ${item.motorcycle.brand} ${item.motorcycle.model}`,
                meta: {
                    status: item.status,
                    total: Number(item.total),
                    date: item.date.toISOString(),
                    clientId: item.client.id,
                    clientName: item.client.name,
                    motorcycleId: item.motorcycle.id,
                    motorcycleLabel: `${item.motorcycle.brand} ${item.motorcycle.model}`,
                    plate: item.motorcycle.plate,
                },
            })),
        ];

        return {
            query: q,
            items,
        };
    }
}