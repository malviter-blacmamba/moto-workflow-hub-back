import prisma from "../lib/prisma";
import { MotorcycleDTO, MotorcycleFilters } from "./motorcycle.types";
import type { Motorcycle as MotorcycleModel } from "@prisma/client";

export class MotorcycleService {
  private static async syncNextMaintenanceReminder(moto: MotorcycleModel) {
    if (!moto) return;

    if (!moto.nextMaintenanceDate) {
      await prisma.reminder.deleteMany({
        where: {
          motorcycleId: moto.id,
          status: "PENDIENTE",
        },
      });
      return;
    }

    const targetDate = new Date(moto.nextMaintenanceDate);
    targetDate.setDate(targetDate.getDate() - 7);

    const existing = await prisma.reminder.findFirst({
      where: {
        motorcycleId: moto.id,
        status: "PENDIENTE",
      },
    });

    if (existing) {
      await prisma.reminder.update({
        where: { id: existing.id },
        data: {
          clientId: moto.clientId,
          targetDate,
        },
      });
    } else {
      await prisma.reminder.create({
        data: {
          clientId: moto.clientId,
          motorcycleId: moto.id,
          serviceId: null,
          targetDate,
          channel: "WHATSAPP",
          status: "PENDIENTE",
          notes: null,
        },
      });
    }
  }

  static async create(data: MotorcycleDTO) {
    const moto = await prisma.motorcycle.create({ data });
    await this.syncNextMaintenanceReminder(moto);
    return moto;
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
    const moto = await prisma.motorcycle.update({
      where: { id },
      data,
    });
    await this.syncNextMaintenanceReminder(moto);
    return moto;
  }

  static async delete(id: number) {
    return prisma.motorcycle.delete({ where: { id } });
  }

  static async list(filters: MotorcycleFilters) {
    const { search = "", clientId, page = 1, pageSize = 10 } = filters;

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
