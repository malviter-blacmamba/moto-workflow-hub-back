import { workorder_status, service_vehicleType } from "@prisma/client";

export interface WorkOrderServiceItemInput {
  serviceId: number;
  quantity?: number;
  unitPrice: number;
}

export interface WorkOrderExtraItemInput {
  name: string;
  quantity?: number;
  unitPrice: number;
}

export interface WorkOrderCreateDTO {
  clientId: number;
  motorcycleId: number;
  assignedToId?: number | null;
  promotionId?: number | null;
  notes?: string;
  date?: string | Date;
  subtotal: number;
  discount?: number;
  total: number;
  services?: WorkOrderServiceItemInput[];
  extraItems?: WorkOrderExtraItemInput[];
  photos?: string[];
}

export interface WorkOrderUpdateDTO {
  clientId?: number;
  motorcycleId?: number;
  assignedToId?: number | null;
  promotionId?: number | null;
  notes?: string | null;
  date?: string | Date;
  subtotal?: number;
  discount?: number;
  total?: number;
  services?: WorkOrderServiceItemInput[];
  extraItems?: WorkOrderExtraItemInput[];
  photos?: string[];
}

export interface WorkOrderFilters {
  search?: string;
  status?: workorder_status;
  clientId?: number;
  motorcycleId?: number;
  vehicleType?: service_vehicleType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}