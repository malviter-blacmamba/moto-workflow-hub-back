import prisma from "../lib/prisma";
import { MotorcycleDTO, MotorcycleFilters } from "./motorcycle.types";

export class MotorcycleService {
  static async create(data: MotorcycleDTO) {
    return prisma.motorcycle.create({ data });
  }

  static async getById(id: number) {
    return prisma.motorcycle.findUnique({
      where: { id },
      include: {
        client: true,
        workOrders: true,
        reminders: true,
      },
    });
  }

  static async update(id: number, data: Partial<MotorcycleDTO>) {
    return prisma.motorcycle.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number) {
    return prisma.motorcycle.delete({ where: { id } });
  }

  static async list(filters: MotorcycleFilters) {
    const {
      search = "",
      clientId,
      page = 1,
      pageSize = 10,
    } = filters;

    const skip = (page - 1) * pageSize;
    const cleanSearch = search.toLowerCase();

    const where: any = {};

    if (clientId) where.clientId = clientId;

    if (search) {
      where.OR = [
        { brand: { contains: cleanSearch } },
        { model: { contains: cleanSearch } },
        { plate: { contains: cleanSearch } },
        { vin: { contains: cleanSearch } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.motorcycle.findMany({
        where,
        include: { client: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.motorcycle.count({ where }),
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
