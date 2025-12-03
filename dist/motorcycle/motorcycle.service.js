"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotorcycleService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class MotorcycleService {
    static async create(data) {
        return prisma_1.default.motorcycle.create({ data });
    }
    static async getById(id) {
        return prisma_1.default.motorcycle.findUnique({
            where: { id },
            include: {
                client: true,
                workOrders: true,
                reminders: true,
            },
        });
    }
    static async update(id, data) {
        return prisma_1.default.motorcycle.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        return prisma_1.default.motorcycle.delete({ where: { id } });
    }
    static async list(filters) {
        const { search = "", clientId, page = 1, pageSize = 10, } = filters;
        const skip = (page - 1) * pageSize;
        const cleanSearch = search.toLowerCase();
        const where = {};
        if (clientId)
            where.clientId = clientId;
        if (search) {
            where.OR = [
                { brand: { contains: cleanSearch } },
                { model: { contains: cleanSearch } },
                { plate: { contains: cleanSearch } },
                { vin: { contains: cleanSearch } },
            ];
        }
        const [items, total] = await prisma_1.default.$transaction([
            prisma_1.default.motorcycle.findMany({
                where,
                include: { client: true },
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.default.motorcycle.count({ where }),
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
exports.MotorcycleService = MotorcycleService;
