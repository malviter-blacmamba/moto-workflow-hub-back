import prisma from "../lib/prisma";
import {
  PromotionDTO,
  PromotionFilters,
  PromotionRuleType,
  PromotionBenefitType,
} from "./promotion.types";

function normalizeConditionFields(
  dto: PromotionDTO | Partial<PromotionDTO>
) {
  const data: any = { ...dto };

  const ruleType = data.ruleType as PromotionRuleType | undefined;
  if (ruleType) {
    if (ruleType === "FIRST_VISIT") {
      data.minVisits = null;
      data.minTotalSpent = null;
    } else if (ruleType === "VISITS_ACCUMULATED") {
      data.visitNumber = null;
      data.minTotalSpent = null;
    } else if (ruleType === "TOTAL_SPENT") {
      data.visitNumber = null;
      data.minVisits = null;
    } else if (ruleType === "REACTIVATION") {
      data.visitNumber = null;
      data.minVisits = null;
      data.minTotalSpent = null;
    }
  }

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
    const data = normalizeConditionFields({
      ...input,
      priority: input.priority ?? 1,
      accumulable: input.accumulable ?? false,
      active: input.active ?? true,
    });

    return prisma.promotion.create({
      data,
      include: {
        freeService: true,
      },
    });
  }

  static async getById(id: number) {
    return prisma.promotion.findUnique({
      where: { id },
      include: {
        freeService: true,
      },
    });
  }

  static async update(id: number, dto: Partial<PromotionDTO>) {
    const data = normalizeConditionFields(dto);

    return prisma.promotion.update({
      where: { id },
      data,
      include: {
        freeService: true,
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
      ruleType,
      benefitType,
      page = 1,
      pageSize = 10,
    } = filters;

    const skip = (page - 1) * pageSize;
    const cleanSearch = search.toLowerCase();

    const where: any = {};

    if (typeof active === "boolean") where.active = active;
    if (ruleType) where.ruleType = ruleType;
    if (benefitType) where.benefitType = benefitType;

    if (search) {
      where.OR = [
        { name: { contains: cleanSearch } },
        { description: { contains: cleanSearch } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.promotion.findMany({
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
