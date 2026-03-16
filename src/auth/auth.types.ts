import type { user_role } from "@prisma/client";

export interface JwtPayload {
  id: number;
  role: user_role;
  iat?: number;
  exp?: number;
}

export interface LoginDTO {
  email: string;
  password: string;
}