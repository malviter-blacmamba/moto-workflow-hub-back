import { Response } from "express";
import { PromotionRuleService } from "./promotion-rule.service";
import type { AuthRequest } from "../middleware/auth";

export class PromotionRuleController {
    static async list(req: AuthRequest, res: Response) {
        try {
            const { search, active, page = "1", pageSize = "10" } = req.query;

            const result = await PromotionRuleService.list({
                search: search as string | undefined,
                active:
                    typeof active === "string"
                        ? active === "true"
                        : undefined,
                page: Number(page) || 1,
                pageSize: Number(pageSize) || 10,
            });

            res.json(result);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al listar tipos" });
        }
    }

    static async getById(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const rule = await PromotionRuleService.getById(id);

            if (!rule) {
                return res.status(404).json({ error: "Tipo no encontrado" });
            }

            res.json(rule);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al obtener tipo" });
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const rule = await PromotionRuleService.create(req.body);
            res.status(201).json(rule);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al crear tipo" });
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const rule = await PromotionRuleService.update(id, req.body);
            res.json(rule);
        } catch (err: any) {
            const status = err.message === "Tipo no encontrado" ? 404 : 400;
            res.status(status).json({ error: err.message ?? "Error al actualizar tipo" });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            await PromotionRuleService.delete(id);
            res.status(200).json({ message: "Regla eliminada" });
        } catch (err: any) {
            const status = err.message === "Tipo no encontrado" ? 404 : 400;
            res.status(status).json({ error: err.message ?? "Error al eliminar tipo" });
        }
    }
}