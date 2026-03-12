import { Response } from "express";
import { UserService } from "./user.service";
import type { user_role, user_status } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

export class UserController {
    static async create(req: AuthRequest, res: Response) {
        try {
            const user = await UserService.create(req.body);
            res.status(201).json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al crear usuario" });
        }
    }

    static async getById(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const user = await UserService.getById(id);

            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            res.json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al obtener usuario" });
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);

            if (req.user?.id === id && req.body.role && req.body.role !== req.user.role) {
                return res.status(403).json({
                    error: "No puedes cambiar tu propio rol desde esta operación",
                });
            }

            const user = await UserService.update(id, req.body);
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al actualizar usuario" });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);

            if (req.user?.id === id) {
                return res.status(403).json({
                    error: "No puedes eliminar tu propio usuario",
                });
            }

            await UserService.delete(id);
            res.status(204).send();
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al eliminar usuario" });
        }
    }

    static async list(req: AuthRequest, res: Response) {
        try {
            const { search, role, status } = req.query;

            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

            const result = await UserService.list({
                search: search as string | undefined,
                role: role as user_role | undefined,
                status: status as user_status | undefined,
                page,
                pageSize,
            });

            res.json(result);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al listar usuarios" });
        }
    }

    static async changeStatus(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const { status } = req.body as { status: user_status };

            if (req.user?.id === id && status === "INACTIVE") {
                return res.status(403).json({
                    error: "No puedes desactivar tu propio usuario",
                });
            }

            const updated = await UserService.changeStatus(id, status);
            res.json(updated);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al cambiar estatus" });
        }
    }
}