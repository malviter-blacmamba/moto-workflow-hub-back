import prisma from "../lib/prisma";
import {
  PromotionDTO,
  PromotionFilters,
} from "./promotion.types";
import { promotion_benefitType } from "@prisma/client";

function normalizePositiveInt(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${field} inválido`);
  }
  return n;
}

function normalizeOptionalPositiveInt(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${field} inválido`);
  }
  return n;
}

function normalizeMoney(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${field} inválido`);
  }
  return n;
}

function normalizePage(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function parseDate(value: string | Date, field: string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} inválido`);
  }
  return date;
}

function normalizeBenefitType(value: string) {
  const allowed = Object.values(promotion_benefitType) as string[];
  if (!allowed.includes(value)) {
    throw new Error("benefitType inválido");
  }
  return value as promotion_benefitType;
}

async function validateRelations(ruleId: number, freeServiceId?: number | null) {
  const rule = await prisma.promotionrule.findUnique({
    where: { id: ruleId },
    select: { id: true },
  });

  if (!rule) {
    throw new Error("Regla de promoción no encontrada");
  }

  if (freeServiceId !== undefined && freeServiceId !== null) {
    const service = await prisma.service.findUnique({
      where: { id: freeServiceId },
      select: { id: true },
    });

    if (!service) {
      throw new Error("Servicio gratis no encontrado");
    }
  }
}

function buildPromotionData(input: PromotionDTO | Partial<PromotionDTO>, isUpdate = false) {
  const data: any = {};

  if (!isUpdate || input.name !== undefined) {
    const name = input.name?.trim();
    if (!name) {
      throw new Error("El nombre de la promoción es obligatorio");
    }
    data.name = name;
  }

  if (!isUpdate || input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  if (!isUpdate || input.ruleId !== undefined) {
    data.ruleId = normalizePositiveInt(input.ruleId, "ruleId");
  }

  if (!isUpdate || input.visitNumber !== undefined) {
    data.visitNumber = normalizeOptionalPositiveInt(input.visitNumber, "visitNumber");
  }

  if (!isUpdate || input.minVisits !== undefined) {
    data.minVisits = normalizeOptionalPositiveInt(input.minVisits, "minVisits");
  }

  if (!isUpdate || input.minTotalSpent !== undefined) {
    data.minTotalSpent = normalizeMoney(input.minTotalSpent, "minTotalSpent");
  }

  if (!isUpdate || input.priority !== undefined) {
    data.priority =
      input.priority !== undefined
        ? normalizePositiveInt(input.priority, "priority")
        : 1;
  }

  if (!isUpdate || input.accumulable !== undefined) {
    data.accumulable = input.accumulable ?? false;
  }

  if (!isUpdate || input.active !== undefined) {
    data.active = input.active ?? true;
  }

  if (!isUpdate || input.startDate !== undefined) {
    if (!input.startDate) {
      throw new Error("startDate es obligatorio");
    }
    data.startDate = parseDate(input.startDate, "startDate");
  }

  if (!isUpdate || input.endDate !== undefined) {
    if (!input.endDate) {
      throw new Error("endDate es obligatorio");
    }
    data.endDate = parseDate(input.endDate, "endDate");
  }

  if (!isUpdate || input.benefitType !== undefined) {
    if (!input.benefitType) {
      throw new Error("benefitType es obligatorio");
    }
    data.benefitType = normalizeBenefitType(input.benefitType);
  }

  if (!isUpdate || input.benefitValue !== undefined) {
    data.benefitValue = normalizeMoney(input.benefitValue, "benefitValue");
  }

  if (!isUpdate || input.freeServiceId !== undefined) {
    data.freeServiceId =
      input.freeServiceId === null || input.freeServiceId === undefined
        ? null
        : normalizePositiveInt(input.freeServiceId, "freeServiceId");
  }

  return data;
}

function validateBenefitConsistency(data: {
  benefitType: promotion_benefitType;
  benefitValue?: number | null;
  freeServiceId?: number | null;
}) {
  if (data.benefitType === promotion_benefitType.FREE_SERVICE) {
    if (!data.freeServiceId) {
      throw new Error("freeServiceId es obligatorio para FREE_SERVICE");
    }
    data.benefitValue = null;
    return;
  }

  if (data.freeServiceId) {
    data.freeServiceId = null;
  }

  if (data.benefitValue === null || data.benefitValue === undefined) {
    throw new Error("benefitValue es obligatorio para este tipo de promoción");
  }

  if (
    data.benefitType === promotion_benefitType.PERCENTAGE &&
    (data.benefitValue <= 0 || data.benefitValue > 100)
  ) {
    throw new Error("El porcentaje debe ser mayor a 0 y menor o igual a 100");
  }

  if (
    data.benefitType === promotion_benefitType.FIXED_AMOUNT &&
    data.benefitValue <= 0
  ) {
    throw new Error("El monto fijo debe ser mayor a 0");
  }
}

export class PromotionService {
  static async create(input: PromotionDTO) {
    const data = buildPromotionData(
      {
        ...input,
        priority: input.priority ?? 1,
        accumulable: input.accumulable ?? false,
        active: input.active ?? true,
      },
      false
    );

    if (data.startDate > data.endDate) {
      throw new Error("startDate no puede ser mayor que endDate");
    }

    validateBenefitConsistency(data);
    await validateRelations(data.ruleId, data.freeServiceId);

    return prisma.promotion.create({
      data,
      include: {
        service: true,
        promotionrule: true,
      },
    });
  }

  static async getById(id: number) {
    const promotionId = normalizePositiveInt(id, "id");

    return prisma.promotion.findUnique({
      where: { id: promotionId },
      include: {
        service: true,
        promotionrule: true,
      },
    });
  }

  static async update(id: number, dto: Partial<PromotionDTO>) {
    const promotionId = normalizePositiveInt(id, "id");

    const existing = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!existing) {
      throw new Error("Promoción no encontrada");
    }

    const partialData = buildPromotionData(dto, true);

    const data = {
      name: partialData.name ?? existing.name,
      description:
        partialData.description !== undefined
          ? partialData.description
          : existing.description,
      ruleId: partialData.ruleId ?? existing.ruleId,
      visitNumber:
        partialData.visitNumber !== undefined
          ? partialData.visitNumber
          : existing.visitNumber,
      minVisits:
        partialData.minVisits !== undefined
          ? partialData.minVisits
          : existing.minVisits,
      minTotalSpent:
        partialData.minTotalSpent !== undefined
          ? partialData.minTotalSpent
          : existing.minTotalSpent,
      benefitType: partialData.benefitType ?? existing.benefitType,
      benefitValue:
        partialData.benefitValue !== undefined
          ? partialData.benefitValue
          : existing.benefitValue,
      freeServiceId:
        partialData.freeServiceId !== undefined
          ? partialData.freeServiceId
          : existing.freeServiceId,
      startDate: partialData.startDate ?? existing.startDate,
      endDate: partialData.endDate ?? existing.endDate,
      priority: partialData.priority ?? existing.priority,
      accumulable:
        partialData.accumulable !== undefined
          ? partialData.accumulable
          : existing.accumulable,
      active:
        partialData.active !== undefined ? partialData.active : existing.active,
    };

    if (data.startDate > data.endDate) {
      throw new Error("startDate no puede ser mayor que endDate");
    }

    validateBenefitConsistency(data);
    await validateRelations(data.ruleId, data.freeServiceId);

    return prisma.promotion.update({
      where: { id: promotionId },
      data,
      include: {
        service: true,
        promotionrule: true,
      },
    });
  }

  static async delete(id: number) {
    const promotionId = normalizePositiveInt(id, "id");

    return prisma.$transaction(async (tx) => {
      const existing = await tx.promotion.findUnique({
        where: { id: promotionId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error("Promoción no encontrada");
      }

      // Anular dependencia en las órdenes de trabajo para evitar Error 500
      await tx.workorder.updateMany({
        where: { promotionId: promotionId },
        data: { promotionId: null }
      });

      await tx.promotion.delete({ where: { id: promotionId } });
      return { success: true };
    });
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

    const currentPage = normalizePage(page, 1);
    const currentPageSize = normalizePage(pageSize, 10);
    const skip = (currentPage - 1) * currentPageSize;
    const cleanSearch = search.trim();

    const where: any = {};

    if (typeof active === "boolean") where.active = active;
    if (ruleId) where.ruleId = ruleId;
    if (benefitType) where.benefitType = normalizeBenefitType(benefitType);

    if (cleanSearch) {
      where.OR = [
        { name: { contains: cleanSearch } },
        { description: { contains: cleanSearch } },
        { promotionrule: { is: { name: { contains: cleanSearch } } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.promotion.findMany({
        where,
        include: {
          service: true,
          promotionrule: true,
        },
        skip,
        take: currentPageSize,
        orderBy: [{ priority: "asc" }, { startDate: "desc" }],
      }),
      prisma.promotion.count({ where }),
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