import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { ENV } from "../config/env";
import type { RegisterDTO, LoginDTO, JwtPayload } from "./auth.types";
import type { User } from "@prisma/client";

const SALT_ROUNDS = 10;

function toSafeUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

export class AuthService {
  static async register(data: RegisterDTO) {
    const name = data.name?.trim();
    const email = data.email?.toLowerCase().trim();
    const password = data.password?.trim();

    if (!name || !email || !password) {
      const err: any = new Error("Nombre, email y contraseña son obligatorios");
      err.status = 400;
      throw err;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err: any = new Error("Email no válido");
      err.status = 400;
      throw err;
    }

    if (password.length < 6) {
      const err: any = new Error("La contraseña debe tener al menos 6 caracteres");
      err.status = 400;
      throw err;
    }

    const exists = await prisma.user.findUnique({ where: { email } });

    if (exists) {
      const err: any = new Error("Email ya registrado");
      err.status = 409;
      throw err;
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: "USER",
      },
    });

    return toSafeUser(user);
  }

  static async login({ email, password }: LoginDTO) {
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      const err: any = new Error("Email y contraseña son obligatorios");
      err.status = 400;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const err: any = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      const err: any = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
    }

    if (user.status !== "ACTIVE") {
      const err: any = new Error("Tu usuario está inactivo. Contacta al administrador.");
      err.code = "INACTIVE_USER";
      err.status = 403;
      throw err;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    return {
      user: toSafeUser(freshUser ?? user),
      token,
    };
  }
}