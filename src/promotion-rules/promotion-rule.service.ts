import prisma from "../lib/prisma";
import { PromotionRuleDTO, PromotionRuleFilters } from "./promotion-rule.types";
import type { Prisma } from "@prisma/client";

export class PromotionRuleService {
  static async create(data: PromotionRuleDTO) {
    return prisma.promotionRule.create({
      data: {
        name: data.name,
        key: data.key,
        conditionLabel: data.conditionLabel,
        active: data.active ?? true,
      },
    });
  }

  static async getById(id: number) {
    return prisma.promotionRule.findUnique({ where: { id } });
  }

  static async update(id: number, data: PromotionRuleDTO) {
    return prisma.promotionRule.update({
      where: { id },
      data: {
        name: data.name,
        key: data.key,
        conditionLabel: data.conditionLabel,
        active: data.active ?? true,
      },
    });
  }

  static async delete(id: number) {
    const rule = await prisma.promotionRule.findUnique({ where: { id } });
    if (!rule) {
      throw new Error("Tipo no encontrado");
    }

    if (rule.active) {
      throw new Error("No se puede eliminar una regla activa. Desactívala primero.");
    }

    const count = await prisma.promotion.count({ where: { ruleId: id } });
    if (count > 0) {
      throw new Error("No se puede eliminar: hay promociones usando este tipo.");
    }

    await prisma.promotionRule.delete({ where: { id } });
  }

  static async list(filters: PromotionRuleFilters) {
    const {
      search = "",
      active,
      page = 1,
      pageSize = 10,
    } = filters;

    const skip = (page - 1) * pageSize;
    const where: Prisma.PromotionRuleWhereInput = {};

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

    const [items, total] = await prisma.$transaction([
      prisma.promotionRule.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "asc" },
      }),
      prisma.promotionRule.count({ where }),
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
