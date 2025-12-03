import prisma from "../lib/prisma";
import type { ClientDTO, ClientFilters } from "./client.types";

export class ClientService {
  static async list(filters: ClientFilters) {
    const { search = "", page = 1, pageSize = 10 } = filters;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const cleanSearch = search.toLowerCase();

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: cleanSearch,
              },
            },
            {
              phone: {
                contains: cleanSearch,
              },
            },
            {
              email: {
                contains: cleanSearch,
              },
            },
          ],
        }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getById(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        motorcycles: true,
        workOrders: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!client) throw new Error("Cliente no encontrado");
    return client;
  }

  static async create(data: ClientDTO) {
    if (!data.name?.trim()) {
      throw new Error("El nombre es obligatorio");
    }

    const membership = data.membership ?? "BASIC";

    const client = await prisma.client.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        membership,
        notes: data.notes?.trim() || null,
      },
    });

    return client;
  }

  static async update(id: number, data: ClientDTO) {
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) throw new Error("Cliente no encontrado");

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name?.trim() ?? exists.name,
        phone: data.phone?.trim() ?? exists.phone,
        email: data.email?.trim() ?? exists.email,
        address: data.address?.trim() ?? exists.address,
        membership: data.membership ?? exists.membership,
        notes: data.notes?.trim() ?? exists.notes,
      },
    });

    return client;
  }

  static async remove(id: number) {
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) throw new Error("Cliente no encontrado");

    await prisma.client.delete({ where: { id } });

    return { success: true };
  }
}
