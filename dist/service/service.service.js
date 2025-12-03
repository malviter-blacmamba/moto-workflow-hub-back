"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class ServiceService {
    static async create(data) {
        const { name, description, basePrice, durationMinutes, maintenanceRule = "NONE", maintenanceValue, } = data;
        return prisma_1.default.service.create({
            data: {
                name,
                description,
                basePrice,
                durationMinutes,
                maintenanceRule,
                maintenanceValue: maintenanceRule === "NONE" ? null : maintenanceValue,
            },
        });
    }
    static async getById(id) {
        return prisma_1.default.service.findUnique({
            where: { id },
            include: {
                workOrderItems: true,
                reminders: true,
                promotions: true,
            },
        });
    }
    static async update(id, data) {
        const { maintenanceRule, maintenanceValue } = data;
        return prisma_1.default.service.update({
            where: { id },
            data: {
                ...data,
                maintenanceValue: maintenanceRule === "NONE"
                    ? null
                    : maintenanceValue ?? undefined,
            },
        });
    }
    static async delete(id) {
        return prisma_1.default.service.delete({ where: { id } });
    }
    static async list(filters) {
        const { search = "", maintenanceRule, page = 1, pageSize = 10, } = filters;
        const skip = (page - 1) * pageSize;
        const cleanSearch = search.toLowerCase();
        const where = {};
        if (maintenanceRule) {
            where.maintenanceRule = maintenanceRule;
        }
        if (search) {
            where.OR = [
                { name: { contains: cleanSearch } },
                { description: { contains: cleanSearch } },
            ];
        }
        const [items, total] = await prisma_1.default.$transaction([
            prisma_1.default.service.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { name: "asc" },
            }),
            prisma_1.default.service.count({ where }),
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
exports.ServiceService = ServiceService;
