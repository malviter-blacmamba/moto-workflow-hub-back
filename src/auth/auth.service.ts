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
    const password = data.password;

    if (!name || !email || !password) {
      throw new Error("Nombre, email y contraseña son obligatorios");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Email no válido");
    }

    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Email ya registrado");

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: data.role ?? "USER",
      },
    });

    return toSafeUser(user);
  }

  static async login({ email, password }: LoginDTO) {
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      throw new Error("Email y contraseña son obligatorios");
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) throw new Error("Credenciales inválidas");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Credenciales inválidas");

    const payload: JwtPayload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    return { user: toSafeUser(user), token };
  }
}
