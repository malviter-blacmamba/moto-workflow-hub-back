export type Membership = "BASIC" | "VIP" | "PREMIUM";

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
  membership?: Membership;
  notes?: string;
}
