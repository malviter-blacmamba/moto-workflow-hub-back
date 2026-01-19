import prisma from "../lib/prisma";
import type {
  ServiceDTO,
  ServiceFilters,
  VehicleType,
  MaintenanceRule,
} from "./service.types";
import { service_maintenanceRule } from "@prisma/client";

export class ServiceService {
  private static toPrismaMaintenanceRule(
    rule: MaintenanceRule | undefined | null
  ): service_maintenanceRule {
    if (!rule || rule === "NONE") return service_maintenanceRule.NONE;
    if (rule === ("BY_KILOMETERS" as any)) return service_maintenanceRule.BY_KM;

    const allowed = Object.values(service_maintenanceRule) as string[];
    if (allowed.includes(rule as any)) return rule as any;

    throw new Error(`maintenanceRule inválido: ${String(rule)}`);
  }

  private static validateRules(
    vehicleType: VehicleType,
    maintenanceRule: service_maintenanceRule,
    maintenanceValue?: number | null
  ) {
    if (
      vehicleType === "MOTO" &&
      maintenanceRule === service_maintenanceRule.BY_HOURS
    ) {
      throw new Error("La regla BY_HOURS solo está disponible para ATV");
    }

    if (maintenanceRule === service_maintenanceRule.NONE) return;

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
    const vehicleType = (data.vehicleType ?? "MOTO") as VehicleType;
    const prismaRule = this.toPrismaMaintenanceRule(data.maintenanceRule);
    const maintenanceValue =
      prismaRule === service_maintenanceRule.NONE
        ? null
        : data.maintenanceValue ?? null;

    this.validateRules(vehicleType, prismaRule, maintenanceValue);

    return prisma.service.create({
      data: {
        vehicleType: vehicleType as any,
        name: data.name,
        description: data.description ?? null,
        basePrice: data.basePrice as any,
        durationMinutes: data.durationMinutes ?? null,
        maintenanceRule: prismaRule,
        maintenanceValue,
      },
    });
  }

  static async getById(id: number) {
    return prisma.service.findUnique({
      where: { id },
      include: {
        reminder: true,
      },
    });
  }

  static async update(id: number, data: Partial<ServiceDTO>) {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) throw new Error("Servicio no encontrado");

    const nextVehicleType = (data.vehicleType ??
      (existing as any).vehicleType ??
      "MOTO") as VehicleType;

    const nextRuleInput = (data.maintenanceRule ??
      ((existing as any).maintenanceRule as any) ??
      "NONE") as MaintenanceRule;

    const nextRule = this.toPrismaMaintenanceRule(nextRuleInput);

    const nextValue =
      nextRule === service_maintenanceRule.NONE
        ? null
        : data.maintenanceValue ?? (existing as any).maintenanceValue ?? null;

    this.validateRules(nextVehicleType, nextRule, nextValue);

    return prisma.service.update({
      where: { id },
      data: {
        ...data,
        vehicleType: nextVehicleType as any,
        maintenanceRule: nextRule,
        maintenanceValue: nextValue,
      } as any,
    });
  }

  static async delete(id: number) {
    return prisma.service.delete({ where: { id } });
  }

  static async list(filters: ServiceFilters) {
    const {
      search = "",
      maintenanceRule,
      vehicleType,
      page = 1,
      pageSize = 10,
    } = filters;

    const skip = (page - 1) * pageSize;
    const cleanSearch = search.trim();

    const where: any = {};

    if (vehicleType) where.vehicleType = vehicleType;

    if (maintenanceRule) {
      where.maintenanceRule = this.toPrismaMaintenanceRule(
        maintenanceRule as any
      );
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
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.service.count({ where }),
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
