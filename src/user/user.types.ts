export type UserRole = "ADMIN" | "USER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserCreateDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserUpdateDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}