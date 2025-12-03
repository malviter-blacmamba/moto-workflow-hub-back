import type { Prisma } from "@prisma/client";

export interface MotorcycleDTO {
  clientId: number;
  brand: string;
  model: string;
  year?: number;
  plate?: string;
  color?: string;
  vin?: string;
  mileageKm?: number;
  nextMaintenanceDate?: Date | string;
  notes?: string;
}

export interface MotorcycleFilters {
  search?: string;
  clientId?: number;
  page?: number;
  pageSize?: number;
}
