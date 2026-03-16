import type { client_membership } from "@prisma/client";

export interface ClientFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ClientDTO {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  membership?: client_membership;
  notes?: string;
}