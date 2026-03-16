import type { user_role, user_status } from "@prisma/client";

export interface UserCreateDTO {
  name: string;
  email: string;
  password: string;
  role?: user_role;
  status?: user_status;
}

export interface UserUpdateDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: user_role;
  status?: user_status;
}

export interface UserFilters {
  search?: string;
  role?: user_role;
  status?: user_status;
  page?: number;
  pageSize?: number;
}