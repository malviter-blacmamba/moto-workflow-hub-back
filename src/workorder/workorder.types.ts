export type WorkOrderStatus =
  | "INGRESADO"
  | "EN_PROGRESO"
  | "LISTO"
  | "ENTREGADO";

export interface WorkOrderServiceItemInput {
  serviceId: number;
  quantity?: number;
  unitPrice?: number;
}

export interface WorkOrderExtraItemInput {
  name: string;
  quantity?: number;
  unitPrice: number;
}

export interface WorkOrderCreateDTO {
  clientId: number;
  motorcycleId: number;
  notes?: string;
  status?: WorkOrderStatus;
  date?: string | Date;

  services?: WorkOrderServiceItemInput[];
  extraItems?: WorkOrderExtraItemInput[];
}

export interface WorkOrderUpdateDTO {
  clientId?: number;
  motorcycleId?: number;
  notes?: string | null;
  status?: WorkOrderStatus;
  date?: string | Date;

  services?: WorkOrderServiceItemInput[];
  extraItems?: WorkOrderExtraItemInput[];
}

export interface WorkOrderFilters {
  search?: string;
  status?: WorkOrderStatus;
  clientId?: number;
  motorcycleId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
