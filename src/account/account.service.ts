import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import type { ChangePasswordDTO, UpdateProfileDTO } from "./account.types";
import type { AuthUser } from "../middleware/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AccountService {
    static async getMe(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        return user;
    }

    static async updateProfile(user: AuthUser, input: UpdateProfileDTO) {
        const existing = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!existing) {
            throw new Error("Usuario no encontrado");
        }

        const nextName = input.name?.trim() ?? existing.name;

        if (!nextName) {
            throw new Error("El nombre es obligatorio");
        }

        let nextEmail = existing.email;

        if (user.role === "ADMIN") {
            if (input.email !== undefined) {
                const normalizedEmail = input.email.toLowerCase().trim();

                if (!normalizedEmail) {
                    throw new Error("El correo es obligatorio");
                }

                if (!EMAIL_REGEX.test(normalizedEmail)) {
                    throw new Error("Correo electrónico no válido");
                }

                if (normalizedEmail !== existing.email) {
                    const used = await prisma.user.findUnique({
                        where: { email: normalizedEmail },
                        select: { id: true },
                    });

                    if (used) {
                        throw new Error("El correo ya está en uso");
                    }
                }

                nextEmail = normalizedEmail;
            }
        } else {
            if (input.email !== undefined && input.email.trim().toLowerCase() !== existing.email) {
                throw new Error("Tu rol no puede cambiar el correo electrónico");
            }
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: nextName,
                email: nextEmail,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return updated;
    }

    static async changePassword(user: AuthUser, input: ChangePasswordDTO) {
        if (user.role !== "ADMIN") {
            throw new Error("Tu rol no puede cambiar la contraseña desde esta sección");
        }

        const currentPassword = input.currentPassword?.trim();
        const newPassword = input.newPassword?.trim();
        const confirmPassword = input.confirmPassword?.trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            throw new Error("Todos los campos de contraseña son obligatorios");
        }

        if (newPassword.length < 6) {
            throw new Error("La nueva contraseña debe tener al menos 6 caracteres");
        }

        if (newPassword !== confirmPassword) {
            throw new Error("La confirmación de contraseña no coincide");
        }

        const existing = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!existing) {
            throw new Error("Usuario no encontrado");
        }

        const valid = await bcrypt.compare(currentPassword, existing.password);

        if (!valid) {
            throw new Error("La contraseña actual es incorrecta");
        }

        const samePassword = await bcrypt.compare(newPassword, existing.password);

        if (samePassword) {
            throw new Error("La nueva contraseña debe ser diferente a la actual");
        }

        const hash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hash,
            },
        });

        return { success: true };
    }
}