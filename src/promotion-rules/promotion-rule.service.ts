import prisma from "../lib/prisma";
import { PromotionRuleDTO, PromotionRuleFilters } from "./promotion-rule.types";
import type { Prisma } from "@prisma/client";

function normalizePositiveInt(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${field} inválido`);
  }
  return n;
}

function normalizePage(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function normalizeKey(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

export class PromotionRuleService {
  static async create(data: PromotionRuleDTO) {
    const name = data.name?.trim();
    const key = normalizeKey(data.key || "");
    const conditionLabel = data.conditionLabel?.trim();

    if (!name) {
      throw new Error("El nombre es obligatorio");
    }

    if (!key) {
      throw new Error("La clave es obligatoria");
    }

    if (!conditionLabel) {
      throw new Error("La etiqueta de condición es obligatoria");
    }

    const existing = await prisma.promotionrule.findUnique({
      where: { key },
      select: { id: true },
    });

    if (existing) {
      throw new Error("La clave ya está registrada");
    }

    return prisma.promotionrule.create({
      data: {
        name,
        key,
        conditionLabel,
        active: data.active ?? true,
      },
    });
  }

  static async getById(id: number) {
    const ruleId = normalizePositiveInt(id, "id");

    return prisma.promotionrule.findUnique({
      where: { id: ruleId },
      include: {
        _count: {
          select: {
            promotion: true,
          },
        },
      },
    });
  }

  static async update(id: number, data: PromotionRuleDTO) {
    const ruleId = normalizePositiveInt(id, "id");

    const existing = await prisma.promotionrule.findUnique({
      where: { id: ruleId },
    });

    if (!existing) {
      throw new Error("Tipo no encontrado");
    }

    const nextName = data.name?.trim() || existing.name;
    const nextKey = data.key ? normalizeKey(data.key) : existing.key;
    const nextConditionLabel =
      data.conditionLabel?.trim() || existing.conditionLabel;

    if (!nextName) {
      throw new Error("El nombre es obligatorio");
    }

    if (!nextKey) {
      throw new Error("La clave es obligatoria");
    }

    if (!nextConditionLabel) {
      throw new Error("La etiqueta de condición es obligatoria");
    }

    if (nextKey !== existing.key) {
      const used = await prisma.promotionrule.findUnique({
        where: { key: nextKey },
        select: { id: true },
      });

      if (used) {
        throw new Error("La clave ya está registrada");
      }
    }

    return prisma.promotionrule.update({
      where: { id: ruleId },
      data: {
        name: nextName,
        key: nextKey,
        conditionLabel: nextConditionLabel,
        active: data.active ?? existing.active,
      },
    });
  }

  static async delete(id: number) {
    const ruleId = normalizePositiveInt(id, "id");

    const rule = await prisma.promotionrule.findUnique({
      where: { id: ruleId },
      include: {
        _count: {
          select: {
            promotion: true,
          },
        },
      },
    });

    if (!rule) {
      throw new Error("Tipo no encontrado");
    }

    if (rule.active) {
      throw new Error("No se puede eliminar una regla activa. Desactívala primero.");
    }

    if (rule._count.promotion > 0) {
      throw new Error("No se puede eliminar: hay promociones usando este tipo.");
    }

    await prisma.promotionrule.delete({ where: { id: ruleId } });

    return { success: true };
  }

  static async list(filters: PromotionRuleFilters) {
    const {
      search = "",
      active,
      page = 1,
      pageSize = 10,
    } = filters;

    const currentPage = normalizePage(page, 1);
    const currentPageSize = normalizePage(pageSize, 10);
    const skip = (currentPage - 1) * currentPageSize;
    const clean = search.trim();

    const where: Prisma.promotionruleWhereInput = {};

    if (clean) {
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
      prisma.promotionrule.findMany({
        where,
        skip,
        take: currentPageSize,
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: {
              promotion: true,
            },
          },
        },
      }),
      prisma.promotionrule.count({ where }),
    ]);

    return {
      items,
      total,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: Math.ceil(total / currentPageSize),
    };
  }
}