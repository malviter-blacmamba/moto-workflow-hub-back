// src/dashboard/dashboard.service.ts
import type { WorkOrderStatus } from "@prisma/client";
import { WorkOrderStatus as WorkOrderStatusEnum } from "@prisma/client";
import prisma from "../lib/prisma";
import type {
  DashboardSummaryFilters,
  DashboardSummaryResponse,
  KanbanWorkOrderItem,
} from "./dashboard.types";

function toISODateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function clampInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(max, Math.trunc(value)));
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(min, Math.min(max, Math.trunc(n)));
  }
  return fallback;
}

export async function getDashboardSummary(
  filters: DashboardSummaryFilters
): Promise<DashboardSummaryResponse> {
  const now = new Date();

  const dateFromRaw = parseDateOnly(filters.dateFrom);
  const dateToRaw = parseDateOnly(filters.dateTo);

  const dateFrom = dateFromRaw ?? startOfMonth(now);
  const dateTo = dateToRaw
    ? new Date(`${toISODateOnly(dateToRaw)}T23:59:59.999Z`)
    : endOfMonth(now);

  const kanbanLimit = clampInt(filters.kanbanLimit, 25, 1, 100);

  const [totalClients, totalMotorcycles, totalWorkOrders, activeWorkOrders] =
    await Promise.all([
      prisma.client.count(),
      prisma.motorcycle.count(),
      prisma.workOrder.count(),
      prisma.workOrder.count({
        where: { status: { not: WorkOrderStatusEnum.ENTREGADO } },
      }),
    ]);

  const revenueAgg = await prisma.workOrder.aggregate({
    where: { date: { gte: dateFrom, lte: dateTo } },
    _sum: { total: true },
  });

  const totalRevenue = Number(revenueAgg._sum.total ?? 0);

  const grouped = await prisma.workOrder.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const statusCounts: Record<WorkOrderStatus, number> = {
    INGRESADO: 0,
    EN_PROGRESO: 0,
    LISTO: 0,
    ENTREGADO: 0,
  };

  for (const row of grouped) {
    statusCounts[row.status] = row._count._all;
  }

  const statuses: WorkOrderStatus[] = [
    WorkOrderStatusEnum.INGRESADO,
    WorkOrderStatusEnum.EN_PROGRESO,
    WorkOrderStatusEnum.LISTO,
    WorkOrderStatusEnum.ENTREGADO,
  ];

  const kanbanEntries = await Promise.all(
    statuses.map(async (status) => {
      const items = await prisma.workOrder.findMany({
        where: { status },
        orderBy: { date: "desc" },
        take: kanbanLimit,
        select: {
          id: true,
          code: true,
          clientId: true,
          motorcycleId: true,
          status: true,
          notes: true,
          date: true,
          subtotal: true,
          total: true,
          client: { select: { name: true } },
          motorcycle: { select: { plate: true, brand: true, model: true } },
        },
      });

      const mapped: KanbanWorkOrderItem[] = items.map((o) => ({
        id: o.id,
        code: o.code,
        clientId: o.clientId,
        motorcycleId: o.motorcycleId,
        status: o.status,
        notes: o.notes ?? null,
        date: o.date.toISOString(),
        subtotal: Number(o.subtotal),
        total: Number(o.total),
        clientName: o.client.name,
        motorcyclePlate: o.motorcycle.plate ?? null,
        motorcycleBrand: o.motorcycle.brand ?? null,
        motorcycleModel: o.motorcycle.model ?? null,
      }));

      return [status, mapped] as const;
    })
  );

  const kanban = Object.fromEntries(kanbanEntries) as Record<
    WorkOrderStatus,
    KanbanWorkOrderItem[]
  >;

  return {
    stats: {
      totalRevenue,
      totalWorkOrders,
      activeWorkOrders,
      totalClients,
      totalMotorcycles,
    },
    statusCounts,
    dateRange: {
      dateFrom: toISODateOnly(dateFrom),
      dateTo: toISODateOnly(dateTo),
    },
    kanban,
  };
}
