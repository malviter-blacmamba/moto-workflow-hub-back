// src/promotion/promotion.controller.ts
import { Request, Response } from "express";
import { PromotionService } from "./promotion.service";
import type {
  PromotionRuleType,
  PromotionBenefitType,
} from "./promotion.types";

export class PromotionController {
  static async create(req: Request, res: Response) {
    try {
      const promo = await PromotionService.create(req.body);
      res.status(201).json(promo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const promo = await PromotionService.getById(id);
      if (!promo)
        return res.status(404).json({ error: "Promoción no encontrada" });
      res.json(promo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const promo = await PromotionService.update(id, req.body);
      res.json(promo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await PromotionService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { search, ruleType, benefitType } = req.query;

      // active viene como string "true"/"false"
      let active: boolean | undefined;
      if (typeof req.query.active === "string") {
        if (req.query.active === "true") active = true;
        else if (req.query.active === "false") active = false;
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      const result = await PromotionService.list({
        search: (search as string) || "",
        ruleType: ruleType as PromotionRuleType | undefined,
        benefitType: benefitType as PromotionBenefitType | undefined,
        active,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
