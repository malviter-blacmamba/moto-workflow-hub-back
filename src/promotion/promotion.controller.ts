import { Response } from "express";
import { PromotionService } from "./promotion.service";
import type { promotion_benefitType } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

export class PromotionController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const promo = await PromotionService.create(req.body);
      res.status(201).json(promo);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al crear promoción" });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const promo = await PromotionService.getById(id);

      if (!promo) {
        return res.status(404).json({ error: "Promoción no encontrada" });
      }

      res.json(promo);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al obtener promoción" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const promo = await PromotionService.update(id, req.body);
      res.json(promo);
    } catch (err: any) {
      const status = err.message === "Promoción no encontrada" ? 404 : 400;
      res.status(status).json({ error: err.message ?? "Error al actualizar promoción" });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      await PromotionService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      const status = err.message === "Promoción no encontrada" ? 404 : 400;
      res.status(status).json({ error: err.message ?? "Error al eliminar promoción" });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const { search, ruleId, benefitType } = req.query;

      let active: boolean | undefined;
      if (typeof req.query.active === "string") {
        if (req.query.active === "true") active = true;
        else if (req.query.active === "false") active = false;
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      let parsedRuleId: number | undefined;
      if (typeof ruleId === "string" && ruleId.trim() !== "") {
        const n = Number(ruleId);
        if (!Number.isNaN(n)) {
          parsedRuleId = n;
        }
      }

      const result = await PromotionService.list({
        search: (search as string) || "",
        ruleId: parsedRuleId,
        benefitType: benefitType as promotion_benefitType | undefined,
        active,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al listar promociones" });
    }
  }
}