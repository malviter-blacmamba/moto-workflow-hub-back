import { Request, Response } from "express";
import { ReminderService } from "./reminder.service";
import type { ReminderChannel, ReminderStatus } from "./reminder.types";

export class ReminderController {
    static async create(req: Request, res: Response) {
        try {
            const reminder = await ReminderService.create(req.body);
            res.status(201).json(reminder);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const reminder = await ReminderService.getById(id);
            if (!reminder) {
                return res.status(404).json({ error: "Recordatorio no encontrado" });
            }
            res.json(reminder);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const reminder = await ReminderService.update(id, req.body);
            res.json(reminder);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            await ReminderService.delete(id);
            res.status(204).send();
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async list(req: Request, res: Response) {
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
                channel: channel as ReminderChannel | undefined,
                status: status as ReminderStatus | undefined,
                dateFrom: dateFrom as string | undefined,
                dateTo: dateTo as string | undefined,
                page,
                pageSize,
            });

            res.json(result);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async markSent(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const updated = await ReminderService.markSent(id);
            res.json(updated);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async markCompleted(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const updated = await ReminderService.markCompleted(id);
            res.json(updated);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
}
