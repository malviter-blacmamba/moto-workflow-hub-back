import type { motorcycle_type } from "@prisma/client";

export interface MotorcycleDTO {
  clientId: number;
  type?: motorcycle_type;
  brand: string;
  model: string;
  year?: number;
  plate?: string;
  color?: string;
  vin?: string;
  mileageKm?: number;
  hoursUsed?: number;
  nextMaintenanceDate?: Date | string;
  maintenanceServiceId?: number;
  notes?: string;
}

export interface MotorcycleFilters {
  search?: string;
  clientId?: number;
  type?: motorcycle_type;
  page?: number;
  pageSize?: number;
}