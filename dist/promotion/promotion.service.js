"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
function normalizeConditionFields(dto) {
    const data = { ...dto };
    const ruleType = data.ruleType;
    if (ruleType) {
        if (ruleType === "FIRST_VISIT") {
            data.minVisits = null;
            data.minTotalSpent = null;
        }
        else if (ruleType === "VISITS_ACCUMULATED") {
            data.visitNumber = null;
            data.minTotalSpent = null;
        }
        else if (ruleType === "TOTAL_SPENT") {
            data.visitNumber = null;
            data.minVisits = null;
        }
        else if (ruleType === "REACTIVATION") {
            data.visitNumber = null;
            data.minVisits = null;
            data.minTotalSpent = null;
        }
    }
    const benefitType = data.benefitType;
    if (benefitType) {
        if (benefitType === "FREE_SERVICE") {
            data.benefitValue = null;
        }
        else {
            data.freeServiceId = null;
        }
    }
    return data;
}
class PromotionService {
    static async create(input) {
        const data = normalizeConditionFields({
            ...input,
            priority: input.priority ?? 1,
            accumulable: input.accumulable ?? false,
            active: input.active ?? true,
        });
        return prisma_1.default.promotion.create({
            data,
            include: {
                freeService: true,
            },
        });
    }
    static async getById(id) {
        return prisma_1.default.promotion.findUnique({
            where: { id },
            include: {
                freeService: true,
            },
        });
    }
    static async update(id, dto) {
        const data = normalizeConditionFields(dto);
        return prisma_1.default.promotion.update({
            where: { id },
            data,
            include: {
                freeService: true,
            },
        });
    }
    static async delete(id) {
        return prisma_1.default.promotion.delete({ where: { id } });
    }
    static async list(filters) {
        const { search = "", active, ruleType, benefitType, page = 1, pageSize = 10, } = filters;
        const skip = (page - 1) * pageSize;
        const cleanSearch = search.toLowerCase();
        const where = {};
        if (typeof active === "boolean")
            where.active = active;
        if (ruleType)
            where.ruleType = ruleType;
        if (benefitType)
            where.benefitType = benefitType;
        if (search) {
            where.OR = [
                { name: { contains: cleanSearch } },
                { description: { contains: cleanSearch } },
            ];
        }
        const [items, total] = await prisma_1.default.$transaction([
            prisma_1.default.promotion.findMany({
                where,
                include: {
                    freeService: true,
                },
                skip,
                take: pageSize,
                orderBy: [
                    { priority: "asc" },
                    { startDate: "desc" },
                ],
            }),
            prisma_1.default.promotion.count({ where }),
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
exports.PromotionService = PromotionService;
