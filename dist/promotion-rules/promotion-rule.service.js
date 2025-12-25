"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionRuleService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class PromotionRuleService {
    static async create(data) {
        return prisma_1.default.promotionRule.create({
            data: {
                name: data.name,
                key: data.key,
                conditionLabel: data.conditionLabel,
                active: data.active ?? true,
            },
        });
    }
    static async getById(id) {
        return prisma_1.default.promotionRule.findUnique({ where: { id } });
    }
    static async update(id, data) {
        return prisma_1.default.promotionRule.update({
            where: { id },
            data: {
                name: data.name,
                key: data.key,
                conditionLabel: data.conditionLabel,
                active: data.active ?? true,
            },
        });
    }
    static async delete(id) {
        const rule = await prisma_1.default.promotionRule.findUnique({ where: { id } });
        if (!rule) {
            throw new Error("Tipo no encontrado");
        }
        if (rule.active) {
            throw new Error("No se puede eliminar una regla activa. Desactívala primero.");
        }
        const count = await prisma_1.default.promotion.count({ where: { ruleId: id } });
        if (count > 0) {
            throw new Error("No se puede eliminar: hay promociones usando este tipo.");
        }
        await prisma_1.default.promotionRule.delete({ where: { id } });
    }
    static async list(filters) {
        const { search = "", active, page = 1, pageSize = 10, } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (search) {
            const clean = search.trim();
            where.OR = [
                { name: { contains: clean } },
                { key: { contains: clean } },
                { conditionLabel: { contains: clean } },
            ];
        }
        if (typeof active === "boolean") {
            where.active = active;
        }
        const [items, total] = await prisma_1.default.$transaction([
            prisma_1.default.promotionRule.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "asc" },
            }),
            prisma_1.default.promotionRule.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }
}
exports.PromotionRuleService = PromotionRuleService;
