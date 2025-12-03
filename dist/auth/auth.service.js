"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const env_1 = require("../config/env");
const SALT_ROUNDS = 10;
function toSafeUser(user) {
    const { password, ...rest } = user;
    return rest;
}
class AuthService {
    static async register(data) {
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
        const exists = await prisma_1.default.user.findUnique({ where: { email } });
        if (exists)
            throw new Error("Email ya registrado");
        const hash = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hash,
                role: data.role ?? "USER",
            },
        });
        return toSafeUser(user);
    }
    static async login({ email, password }) {
        const normalizedEmail = email?.toLowerCase().trim();
        if (!normalizedEmail || !password) {
            throw new Error("Email y contraseña son obligatorios");
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user)
            throw new Error("Credenciales inválidas");
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid)
            throw new Error("Credenciales inválidas");
        const payload = { id: user.id, role: user.role };
        const token = jsonwebtoken_1.default.sign(payload, env_1.ENV.JWT_SECRET, {
            expiresIn: "7d",
        });
        return { user: toSafeUser(user), token };
    }
}
exports.AuthService = AuthService;
