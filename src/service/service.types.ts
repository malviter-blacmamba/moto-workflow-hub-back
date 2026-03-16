import type { service_maintenanceRule, service_vehicleType } from "@prisma/client";

export interface ServiceFilters {
  search?: string;
  vehicleType?: service_vehicleType;
  maintenanceRule?: service_maintenanceRule;
  page?: number;
  pageSize?: number;
}

export interface ServiceDTO {
  vehicleType?: service_vehicleType;
  name: string;
  description?: string | null;
  basePrice: number;
  durationMinutes?: number | null;
  maintenanceRule?: service_maintenanceRule;
  maintenanceValue?: number | null;
}