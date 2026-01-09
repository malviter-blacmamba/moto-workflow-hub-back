export type MotorcycleType = "MOTO" | "ATV";

export interface MotorcycleDTO {
  clientId: number;
  type?: MotorcycleType;
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
  type?: MotorcycleType;
  page?: number;
  pageSize?: number;
}
