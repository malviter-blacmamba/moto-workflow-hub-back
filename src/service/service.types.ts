export type MaintenanceRule = "NONE" | "BY_MONTHS" | "BY_KM";

export interface ServiceFilters {
  search?: string;
  maintenanceRule?: MaintenanceRule;
  page?: number;
  pageSize?: number;
}

export interface ServiceDTO {
  name: string;
  description?: string;
  basePrice: number;
  durationMinutes?: number;
  maintenanceRule?: MaintenanceRule;
  maintenanceValue?: number | null;
}
