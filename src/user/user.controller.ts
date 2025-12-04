import { Request, Response } from "express";
import { UserService } from "./user.service";
import type { Role, UserStatus } from "@prisma/client";

export class UserController {
    static async create(req: Request, res: Response) {
        try {
            const user = await UserService.create(req.body);
            res.status(201).json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const user = await UserService.getById(id);
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const user = await UserService.update(id, req.body);
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            await UserService.delete(id);
            res.status(204).send();
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async list(req: Request, res: Response) {
        try {
            const { search, role, status } = req.query;

            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

            const result = await UserService.list({
                search: search as string | undefined,
                role: role as Role | undefined,
                status: status as UserStatus | undefined,
                page,
                pageSize,
            });

            res.json(result);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async changeStatus(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const { status } = req.body as { status: UserStatus };
            const updated = await UserService.changeStatus(id, status);
            res.json(updated);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
}
