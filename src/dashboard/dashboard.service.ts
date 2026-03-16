import { workorder_status, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import type {
  DashboardSummaryFilters,
  DashboardSummaryResponse,
  KanbanWorkOrderItem,
} from "./dashboard.types";
import type { UserRole } from "../auth/auth.types";

type WorkOrderStatus = (typeof workorder_status)[keyof typeof workorder_status];

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
  filters: DashboardSummaryFilters,
  role: UserRole
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
      prisma.workorder.count(),
      prisma.workorder.count({
        where: { status: { not: workorder_status.ENTREGADO } },
      }),
    ]);

  const revenueAgg = await prisma.workorder.aggregate({
    where: { date: { gte: dateFrom, lte: dateTo } },
    _sum: { total: true },
  });

  const statuses: WorkOrderStatus[] = [
    workorder_status.INGRESADO,
    workorder_status.EN_PROGRESO,
    workorder_status.LISTO,
    workorder_status.ENTREGADO,
  ];

  const statusCounts: Record<WorkOrderStatus, number> = {
    INGRESADO: 0,
    EN_PROGRESO: 0,
    LISTO: 0,
    ENTREGADO: 0,
  };

  const kanbanEntries = await Promise.all(
    statuses.map(async (status) => {
      // Definimos la regla de búsqueda UNA sola vez para conteo y tarjetas
      const whereClause: Prisma.workorderWhereInput = {
        status,
        NOT:
          status === workorder_status.ENTREGADO
            ? {
              deliveredAt: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            }
            : undefined,
      };

      const [totalInColumn, items] = await prisma.$transaction([
        prisma.workorder.count({ where: whereClause }),
        prisma.workorder.findMany({
          where: whereClause,
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
            assignedTo: { select: { name: true } }, // Agregado el responsable
          },
        }),
      ]);

      statusCounts[status] = totalInColumn;

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
        assignedToName: o.assignedTo?.name ?? null,
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
      totalRevenue: role === "ADMIN" ? Number(revenueAgg._sum.total ?? 0) : null,
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