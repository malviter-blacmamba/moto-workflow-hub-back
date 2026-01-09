export type VehicleType = "MOTO" | "ATV";
export type MaintenanceRule =
  | "NONE"
  | "BY_MONTHS"
  | "BY_KM"
  | "BY_DAYS"
  | "BY_HOURS";

export interface ServiceFilters {
  search?: string;
  vehicleType?: VehicleType;
  maintenanceRule?: MaintenanceRule;
  page?: number;
  pageSize?: number;
}

export interface ServiceDTO {
  vehicleType?: VehicleType;
  name: string;
  description?: string;
  basePrice: number;
  durationMinutes?: number;
  maintenanceRule?: MaintenanceRule;
  maintenanceValue?: number | null;
}
