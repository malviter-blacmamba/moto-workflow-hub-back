import { Response } from "express";
import { ReminderService } from "./reminder.service";
import type { reminder_channel, reminder_status } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

export class ReminderController {
    static async create(req: AuthRequest, res: Response) {
        try {
            const reminder = await ReminderService.create(req.body);
            res.status(201).json(reminder);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al crear recordatorio" });
        }
    }

    static async getById(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const reminder = await ReminderService.getById(id);

            if (!reminder) {
                return res.status(404).json({ error: "Recordatorio no encontrado" });
            }

            res.json(reminder);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al obtener recordatorio" });
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const reminder = await ReminderService.update(id, req.body);
            res.json(reminder);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al actualizar recordatorio" });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            await ReminderService.delete(id);
            res.status(204).send();
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al eliminar recordatorio" });
        }
    }

    static async list(req: AuthRequest, res: Response) {
        try {
            const {
                search,
                clientId,
                motorcycleId,
                serviceId,
                channel,
                status,
                dateFrom,
                dateTo,
            } = req.query;

            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

            const result = await ReminderService.list({
                search: search as string | undefined,
                clientId: clientId ? Number(clientId) : undefined,
                motorcycleId: motorcycleId ? Number(motorcycleId) : undefined,
                serviceId: serviceId ? Number(serviceId) : undefined,
                channel: channel as reminder_channel | undefined,
                status: status as reminder_status | undefined,
                dateFrom: dateFrom as string | undefined,
                dateTo: dateTo as string | undefined,
                page,
                pageSize,
            });

            res.json(result);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al listar recordatorios" });
        }
    }

    static async markSent(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const updated = await ReminderService.markSent(id);
            res.json(updated);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al marcar enviado" });
        }
    }

    static async markCompleted(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const updated = await ReminderService.markCompleted(id);
            res.json(updated);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al marcar completado" });
        }
    }
}