import { Request, Response } from "express";
import { WorkOrderService } from "./workorder.service";
import type { WorkOrderStatus } from "./workorder.types";

export class WorkOrderController {
    static async create(req: Request, res: Response) {
        try {
            const workOrder = await WorkOrderService.create(req.body);
            res.status(201).json(workOrder);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const workOrder = await WorkOrderService.getById(id);
            if (!workOrder) {
                return res
                    .status(404)
                    .json({ error: "Orden de trabajo no encontrada" });
            }
            res.json(workOrder);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const workOrder = await WorkOrderService.update(id, req.body);
            res.json(workOrder);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            await WorkOrderService.delete(id);
            res.status(204).send();
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async list(req: Request, res: Response) {
        try {
            const {
                search,
                status,
                clientId,
                motorcycleId,
                dateFrom,
                dateTo,
            } = req.query;

            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

            const result = await WorkOrderService.list({
                search: search as string | undefined,
                status: status as WorkOrderStatus | undefined,
                clientId: clientId ? Number(clientId) : undefined,
                motorcycleId: motorcycleId ? Number(motorcycleId) : undefined,
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

    static async changeStatus(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const { status } = req.body as { status: WorkOrderStatus };
            const updated = await WorkOrderService.changeStatus(id, status);
            res.json(updated);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
}
