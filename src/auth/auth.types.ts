export type UserRole = "ADMIN" | "USER";

export interface JwtPayload {
  id: number;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}