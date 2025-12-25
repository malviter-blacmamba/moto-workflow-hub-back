"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionRuleController = void 0;
const promotion_rule_service_1 = require("./promotion-rule.service");
class PromotionRuleController {
    static async list(req, res) {
        try {
            const { search, active, page = "1", pageSize = "10" } = req.query;
            const result = await promotion_rule_service_1.PromotionRuleService.list({
                search: search,
                active: typeof active === "string"
                    ? active === "true"
                    : undefined,
                page: Number(page) || 1,
                pageSize: Number(pageSize) || 10,
            });
            res.json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const rule = await promotion_rule_service_1.PromotionRuleService.getById(id);
            if (!rule)
                return res.status(404).json({ error: "Tipo no encontrado" });
            res.json(rule);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async create(req, res) {
        try {
            const rule = await promotion_rule_service_1.PromotionRuleService.create(req.body);
            res.status(201).json(rule);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const rule = await promotion_rule_service_1.PromotionRuleService.update(id, req.body);
            res.json(rule);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await promotion_rule_service_1.PromotionRuleService.delete(id);
            res.status(200).json({ message: "Regla eliminada" });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}
exports.PromotionRuleController = PromotionRuleController;
