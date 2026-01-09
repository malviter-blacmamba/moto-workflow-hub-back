import prisma from "../lib/prisma";
import {
  ServiceDTO,
  ServiceFilters,
  VehicleType,
  MaintenanceRule,
} from "./service.types";

export class ServiceService {
  private static validateRules(
    vehicleType: VehicleType,
    maintenanceRule: MaintenanceRule,
    maintenanceValue?: number | null
  ) {
    if (vehicleType === "MOTO" && maintenanceRule === "BY_HOURS") {
      throw new Error("La regla BY_HOURS solo está disponible para ATV");
    }

    if (maintenanceRule === "NONE") return;

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
    const vehicleType = data.vehicleType ?? "MOTO";
    const maintenanceRule = data.maintenanceRule ?? "NONE";
    const maintenanceValue =
      maintenanceRule === "NONE" ? null : data.maintenanceValue ?? null;

    this.validateRules(vehicleType, maintenanceRule, maintenanceValue);

    return prisma.service.create({
      data: {
        vehicleType: vehicleType as any,
        name: data.name,
        description: data.description,
        basePrice: data.basePrice as any,
        durationMinutes: data.durationMinutes,
        maintenanceRule: maintenanceRule as any,
        maintenanceValue,
      },
    });
  }

  static async getById(id: number) {
    return prisma.service.findUnique({
      where: { id },
      include: {
        workOrderItems: true,
        reminders: true,
        promotions: true,
      },
    });
  }

  static async update(id: number, data: Partial<ServiceDTO>) {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) throw new Error("Servicio no encontrado");

    const nextVehicleType = (data.vehicleType ??
      (existing as any).vehicleType ??
      "MOTO") as VehicleType;
    const nextRule = (data.maintenanceRule ??
      (existing as any).maintenanceRule ??
      "NONE") as MaintenanceRule;

    const nextValue =
      nextRule === "NONE"
        ? null
        : data.maintenanceValue ?? (existing as any).maintenanceValue ?? null;

    this.validateRules(nextVehicleType, nextRule, nextValue);

    return prisma.service.update({
      where: { id },
      data: {
        ...data,
        vehicleType: nextVehicleType as any,
        maintenanceRule: nextRule as any,
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
    const cleanSearch = search.toLowerCase();

    const where: any = {};

    if (vehicleType) where.vehicleType = vehicleType;
    if (maintenanceRule) where.maintenanceRule = maintenanceRule;

    if (search) {
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
