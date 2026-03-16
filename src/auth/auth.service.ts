import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { ENV } from "../config/env";
import type { LoginDTO, JwtPayload } from "./auth.types";
import type { user } from "@prisma/client";

function toSafeUser(userObj: user) {
  const { password, ...rest } = userObj;
  return rest;
}

export class AuthService {
  static async login({ email, password }: LoginDTO) {
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      const err: any = new Error("Email y contraseña son obligatorios");
      err.status = 400;
      throw err;
    }

    const userObj = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!userObj) {
      const err: any = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
    }

    const valid = await bcrypt.compare(password, userObj.password);

    if (!valid) {
      const err: any = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
    }

    if (userObj.status !== "ACTIVE") {
      const err: any = new Error("Tu usuario está inactivo. Contacta al administrador.");
      err.code = "INACTIVE_USER";
      err.status = 403;
      throw err;
    }

    await prisma.user.update({
      where: { id: userObj.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = { id: userObj.id, role: userObj.role };
    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    const freshUser = await prisma.user.findUnique({
      where: { id: userObj.id },
    });

    return {
      user: toSafeUser(freshUser ?? userObj),
      token,
    };
  }
}