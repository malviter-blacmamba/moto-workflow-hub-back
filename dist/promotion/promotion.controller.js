"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionController = void 0;
const promotion_service_1 = require("./promotion.service");
class PromotionController {
    static async create(req, res) {
        try {
            const promo = await promotion_service_1.PromotionService.create(req.body);
            res.status(201).json(promo);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const promo = await promotion_service_1.PromotionService.getById(id);
            if (!promo)
                return res.status(404).json({ error: "Promoción no encontrada" });
            res.json(promo);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const promo = await promotion_service_1.PromotionService.update(id, req.body);
            res.json(promo);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await promotion_service_1.PromotionService.delete(id);
            res.status(204).send();
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async list(req, res) {
        try {
            const { search, ruleType, benefitType } = req.query;
            // active viene como string "true"/"false"
            let active;
            if (typeof req.query.active === "string") {
                if (req.query.active === "true")
                    active = true;
                else if (req.query.active === "false")
                    active = false;
            }
            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
            const result = await promotion_service_1.PromotionService.list({
                search: search || "",
                ruleType: ruleType,
                benefitType: benefitType,
                active,
                page,
                pageSize,
            });
            res.json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}
exports.PromotionController = PromotionController;
