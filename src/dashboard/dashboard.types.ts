// src/dashboard/dashboard.types.ts
import type { WorkOrderStatus } from "@prisma/client";

export type DashboardSummaryFilters = {
  dateFrom?: string;
  dateTo?: string;
  kanbanLimit?: number;
};

export type DashboardStats = {
  totalRevenue: number;
  totalWorkOrders: number;
  activeWorkOrders: number;
  totalClients: number;
  totalMotorcycles: number;
};

export type KanbanWorkOrderItem = {
  id: number;
  code: string;
  clientId: number;
  motorcycleId: number;
  status: WorkOrderStatus;
  notes: string | null;
  date: string;
  subtotal: number;
  total: number;
  clientName: string;
  motorcyclePlate: string | null;
  motorcycleBrand: string | null;
  motorcycleModel: string | null;
};

export type DashboardSummaryResponse = {
  stats: DashboardStats;
  statusCounts: Record<WorkOrderStatus, number>;
  dateRange: { dateFrom: string; dateTo: string };
  kanban: Record<WorkOrderStatus, KanbanWorkOrderItem[]>;
};
