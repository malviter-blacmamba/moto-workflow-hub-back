import type { workorder_status } from "@prisma/client";

export type DashboardSummaryFilters = {
  dateFrom?: string;
  dateTo?: string;
  kanbanLimit?: number;
};

export type DashboardStats = {
  totalRevenue: number | null;
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
  status: workorder_status;
  notes: string | null;
  date: string;
  subtotal: number;
  total: number;
  clientName: string;
  motorcyclePlate: string | null;
  motorcycleBrand: string | null;
  motorcycleModel: string | null;
  assignedTo: { id: number; name: string } | null;
};

export type DashboardSummaryResponse = {
  stats: DashboardStats;
  statusCounts: Record<workorder_status, number>;
  dateRange: { dateFrom: string; dateTo: string };
  kanban: Record<workorder_status, KanbanWorkOrderItem[]>;
};