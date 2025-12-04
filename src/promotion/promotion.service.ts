import prisma from "../lib/prisma";
import {
  PromotionDTO,
  PromotionFilters,
  PromotionBenefitType,
} from "./promotion.types";

function normalizeConditionFields(dto: PromotionDTO | Partial<PromotionDTO>) {
  const data: any = { ...dto };

  const benefitType = data.benefitType as PromotionBenefitType | undefined;
  if (benefitType) {
    if (benefitType === "FREE_SERVICE") {
      data.benefitValue = null;
    } else {
      data.freeServiceId = null;
    }
  }

  return data;
}

export class PromotionService {
  static async create(input: PromotionDTO) {
    const base = normalizeConditionFields({
      ...input,
      priority: input.priority ?? 1,
      accumulable: input.accumulable ?? false,
      active: input.active ?? true,
    });

    const data: any = {
      ...base,
      startDate: base.startDate ? new Date(base.startDate) : undefined,
      endDate: base.endDate ? new Date(base.endDate) : undefined,
    };

    return prisma.promotion.create({
      data,
      include: {
        freeService: true,
        rule: true,
      },
    });
  }

  static async getById(id: number) {
    return prisma.promotion.findUnique({
      where: { id },
      include: {
        freeService: true,
        rule: true,
      },
    });
  }

  static async update(id: number, dto: Partial<PromotionDTO>) {
    const base = normalizeConditionFields(dto);

    const data: any = {
      ...base,
    };

    if (base.startDate) data.startDate = new Date(base.startDate);
    if (base.endDate) data.endDate = new Date(base.endDate);

    return prisma.promotion.update({
      where: { id },
      data,
      include: {
        freeService: true,
        rule: true,
      },
    });
  }

  static async delete(id: number) {
    return prisma.promotion.delete({ where: { id } });
  }

  static async list(filters: PromotionFilters) {
    const {
      search = "",
      active,
      ruleId,
      benefitType,
      page = 1,
      pageSize = 10,
    } = filters;

    const skip = (page - 1) * pageSize;
    const cleanSearch = search.toLowerCase();

    const where: any = {};

    if (typeof active === "boolean") where.active = active;
    if (ruleId) where.ruleId = ruleId;
    if (benefitType) where.benefitType = benefitType;

    if (search) {
      where.OR = [
        { name: { contains: cleanSearch } },
        { description: { contains: cleanSearch } },
        { rule: { name: { contains: cleanSearch } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.promotion.findMany({
        where,
        include: {
          freeService: true,
          rule: true,
        },
        skip,
        take: pageSize,
        orderBy: [{ priority: "asc" }, { startDate: "desc" }],
      }),
      prisma.promotion.count({ where }),
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
