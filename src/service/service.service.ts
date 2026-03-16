import prisma from "../lib/prisma";
import type {
  ServiceDTO,
  ServiceFilters,
} from "./service.types";
import {
  service_maintenanceRule,
  service_vehicleType,
} from "@prisma/client";

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

function normalizeMoney(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
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

export class ServiceService {
  private static toPrismaVehicleType(
    vehicleType: string | undefined | null
  ): service_vehicleType {
    if (!vehicleType) return service_vehicleType.BOTH; // Si no se especifica, por defecto aplica a ambos

    const allowed = Object.values(service_vehicleType) as string[];
    if (allowed.includes(vehicleType)) {
      return vehicleType as service_vehicleType;
    }
    throw new Error(`vehicleType inválido: ${String(vehicleType)}`);
  }

  private static toPrismaMaintenanceRule(
    rule: string | undefined | null
  ): service_maintenanceRule {
    if (!rule || rule === "NONE") return service_maintenanceRule.NONE;

    const allowed = Object.values(service_maintenanceRule) as string[];
    if (allowed.includes(rule)) {
      return rule as service_maintenanceRule;
    }

    throw new Error(`maintenanceRule inválido: ${String(rule)}`);
  }

  private static validateRules(
    vehicleType: service_vehicleType,
    maintenanceRule: service_maintenanceRule,
    maintenanceValue?: number | null
  ) {
    if (
      vehicleType === service_vehicleType.MOTO &&
      maintenanceRule === service_maintenanceRule.BY_HOURS
    ) {
      throw new Error("La regla BY_HOURS solo está disponible para ATV o BOTH");
    }

    if (maintenanceRule === service_maintenanceRule.NONE) {
      return;
    }

    if (
      maintenanceValue === null ||
      maintenanceValue === undefined ||
      Number.isNaN(Number(maintenanceValue))
    ) {
      throw new Error(
        "maintenanceValue es requerido cuando maintenanceRule no es NONE"
      );
    }

    if (Number(maintenanceValue) <= 0) {
      throw new Error("maintenanceValue debe ser mayor a 0");
    }
  }

  static async create(data: ServiceDTO) {
    const name = data.name?.trim();
    if (!name) {
      throw new Error("El nombre del servicio es obligatorio");
    }

    const vehicleType = this.toPrismaVehicleType(data.vehicleType);
    const maintenanceRule = this.toPrismaMaintenanceRule(data.maintenanceRule);
    const maintenanceValue =
      maintenanceRule === service_maintenanceRule.NONE
        ? null
        : normalizeOptionalPositiveInt(data.maintenanceValue, "maintenanceValue");

    this.validateRules(vehicleType, maintenanceRule, maintenanceValue);

    return prisma.service.create({
      data: {
        vehicleType,
        name,
        description: data.description?.trim() || null,
        basePrice: normalizeMoney(data.basePrice, "basePrice"),
        durationMinutes: normalizeOptionalPositiveInt(
          data.durationMinutes,
          "durationMinutes"
        ),
        maintenanceRule,
        maintenanceValue,
      },
    });
  }

  static async getById(id: number) {
    const serviceId = normalizePositiveInt(id, "id");

    return prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        promotion: true,
        reminder: true,
        _count: {
          select: {
            promotion: true,
            reminder: true,
            workorderserviceitem: true,
          },
        },
      },
    });
  }

  static async update(id: number, data: Partial<ServiceDTO>) {
    const serviceId = normalizePositiveInt(id, "id");

    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existing) {
      throw new Error("Servicio no encontrado");
    }

    const nextVehicleType = this.toPrismaVehicleType(
      data.vehicleType ?? existing.vehicleType
    );

    const nextRule = this.toPrismaMaintenanceRule(
      data.maintenanceRule ?? existing.maintenanceRule
    );

    const nextValue =
      nextRule === service_maintenanceRule.NONE
        ? null
        : data.maintenanceValue !== undefined
          ? normalizeOptionalPositiveInt(data.maintenanceValue, "maintenanceValue")
          : existing.maintenanceValue;

    this.validateRules(nextVehicleType, nextRule, nextValue);

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: {
        vehicleType: nextVehicleType,
        name: data.name !== undefined ? data.name.trim() : existing.name,
        description:
          data.description !== undefined
            ? data.description?.trim() || null
            : existing.description,
        basePrice:
          data.basePrice !== undefined
            ? normalizeMoney(data.basePrice, "basePrice")
            : existing.basePrice,
        durationMinutes:
          data.durationMinutes !== undefined
            ? normalizeOptionalPositiveInt(data.durationMinutes, "durationMinutes")
            : existing.durationMinutes,
        maintenanceRule: nextRule,
        maintenanceValue: nextValue,
      },
    });

    return updated;
  }

  static async delete(id: number) {
    const serviceId = normalizePositiveInt(id, "id");

    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        _count: {
          select: {
            promotion: true,
            reminder: true,
            workorderserviceitem: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Servicio no encontrado");
    }

    if (
      existing._count.promotion > 0 ||
      existing._count.reminder > 0 ||
      existing._count.workorderserviceitem > 0
    ) {
      throw new Error(
        "No se puede eliminar el servicio porque tiene promociones, recordatorios u órdenes asociadas"
      );
    }

    await prisma.service.delete({ where: { id: serviceId } });
    return { success: true };
  }

  static async list(filters: ServiceFilters) {
    const {
      search = "",
      maintenanceRule,
      vehicleType,
      page = 1,
      pageSize = 10,
    } = filters;

    const currentPage = normalizePage(page, 1);
    const currentPageSize = normalizePage(pageSize, 10);
    const skip = (currentPage - 1) * currentPageSize;
    const cleanSearch = search.trim();

    const where: {
      vehicleType?: service_vehicleType;
      maintenanceRule?: service_maintenanceRule;
      OR?: Array<{
        name?: { contains: string };
        description?: { contains: string };
      }>;
    } = {};

    if (vehicleType) {
      where.vehicleType = this.toPrismaVehicleType(vehicleType);
    }

    if (maintenanceRule) {
      where.maintenanceRule = this.toPrismaMaintenanceRule(maintenanceRule);
    }

    if (cleanSearch) {
      where.OR = [
        { name: { contains: cleanSearch } },
        { description: { contains: cleanSearch } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.service.findMany({
        where,
        skip,
        take: currentPageSize,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              promotion: true,
              reminder: true,
              workorderserviceitem: true,
            },
          },
        },
      }),
      prisma.service.count({ where }),
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