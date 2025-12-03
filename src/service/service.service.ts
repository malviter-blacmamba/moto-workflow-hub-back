import prisma from "../lib/prisma";
import { ServiceDTO, ServiceFilters } from "./service.types";

export class ServiceService {
  static async create(data: ServiceDTO) {
    const {
      name,
      description,
      basePrice,
      durationMinutes,
      maintenanceRule = "NONE",
      maintenanceValue,
    } = data;

    return prisma.service.create({
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
    const { maintenanceRule, maintenanceValue } = data;

    return prisma.service.update({
      where: { id },
      data: {
        ...data,
        maintenanceValue:
          maintenanceRule === "NONE"
            ? null
            : maintenanceValue ?? undefined,
      },
    });
  }

  static async delete(id: number) {
    return prisma.service.delete({ where: { id } });
  }

  static async list(filters: ServiceFilters) {
    const {
      search = "",
      maintenanceRule,
      page = 1,
      pageSize = 10,
    } = filters;

    const skip = (page - 1) * pageSize;
    const cleanSearch = search.toLowerCase();

    const where: any = {};

    if (maintenanceRule) {
      where.maintenanceRule = maintenanceRule;
    }

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
