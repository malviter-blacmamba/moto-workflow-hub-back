import { Request, Response } from "express";
import { PromotionRuleService } from "./promotion-rule.service";

export class PromotionRuleController {
    static async list(req: Request, res: Response) {
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
            res.status(400).json({ error: err.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const rule = await PromotionRuleService.getById(id);
            if (!rule) return res.status(404).json({ error: "Tipo no encontrado" });
            res.json(rule);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const rule = await PromotionRuleService.create(req.body);
            res.status(201).json(rule);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const rule = await PromotionRuleService.update(id, req.body);
            res.json(rule);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            await PromotionRuleService.delete(id);

            res.status(200).json({ message: "Regla eliminada" });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

}
