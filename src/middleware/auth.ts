import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import prisma from "../lib/prisma";
import { user_role, user_status } from "@prisma/client";
import type { JwtPayload } from "../auth/auth.types";

export interface AuthUser {
  id: number;
  role: user_role;
  email: string;
  name: string;
  status: user_status;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.slice(7).trim();

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        error: "Usuario inactivo. Contacte al administrador.",
      });
    }

    req.user = user as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};