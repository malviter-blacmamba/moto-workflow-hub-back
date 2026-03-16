import prisma from "../lib/prisma";
import type { ClientDTO, ClientFilters } from "./client.types";
import { NotificationService } from "../notifications/notification.service";

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

export class ClientService {
  static async list(filters: ClientFilters) {
    const search = filters.search?.trim() ?? "";
    const page = normalizePage(filters.page, 1);
    const pageSize = normalizePage(filters.pageSize, 10);

    const skip = (page - 1) * pageSize;

    const where = search
      ? {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
          { address: { contains: search } },
        ],
      }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              motorcycle: true,
              workorder: true,
            },
          },
        },
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
    const clientId = normalizePositiveInt(id, "id");

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        motorcycle: {
          orderBy: { createdAt: "desc" },
        },
        workorder: {
          orderBy: { date: "desc" },
          include: {
            motorcycle: {
              select: {
                id: true,
                brand: true,
                model: true,
                plate: true,
                type: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        reminder: {
          orderBy: { targetDate: "asc" },
          include: {
            motorcycle: {
              select: {
                id: true,
                brand: true,
                model: true,
                plate: true,
                type: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            motorcycle: true,
            workorder: true,
            reminder: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error("Cliente no encontrado");
    }

    return client;
  }

  static async create(data: ClientDTO, currentUserId: number) {
    const name = data.name?.trim();
    const email = data.email?.trim() || null;
    const phone = data.phone?.trim() || null;
    const address = data.address?.trim() || null;
    const notes = data.notes?.trim() || null;
    const membership = data.membership ?? "BASIC";

    if (!name) {
      throw new Error("El nombre es obligatorio");
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email,
        address,
        membership,
        notes,
      },
    });

    // Regla de Negocio: Notificar que se registró un nuevo cliente
    await NotificationService.create({
      userId: currentUserId,
      type: "NEW_CLIENT",
      title: "Nuevo Cliente Registrado",
      message: `Se ha registrado al cliente ${client.name}.`,
      entityType: "CLIENT",
      entityId: client.id
    }).catch(() => { /* Ignorar errores para no bloquear el registro del cliente */ });

    return client;
  }

  static async update(id: number, data: ClientDTO) {
    const clientId = normalizePositiveInt(id, "id");

    const exists = await prisma.client.findUnique({ where: { id: clientId } });

    if (!exists) {
      throw new Error("Cliente no encontrado");
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name?.trim() ?? exists.name,
        phone: data.phone !== undefined ? data.phone?.trim() || null : exists.phone,
        email: data.email !== undefined ? data.email?.trim() || null : exists.email,
        address:
          data.address !== undefined ? data.address?.trim() || null : exists.address,
        membership: data.membership ?? exists.membership,
        notes: data.notes !== undefined ? data.notes?.trim() || null : exists.notes,
      },
    });

    return client;
  }

  static async remove(id: number) {
    const clientId = normalizePositiveInt(id, "id");

    const exists = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        _count: {
          select: {
            motorcycle: true,
            workorder: true,
            reminder: true,
          },
        },
      },
    });

    if (!exists) {
      throw new Error("Cliente no encontrado");
    }

    if (
      exists._count.motorcycle > 0 ||
      exists._count.workorder > 0 ||
      exists._count.reminder > 0
    ) {
      throw new Error(
        "No se puede eliminar el cliente porque tiene vehículos, órdenes o recordatorios asociados"
      );
    }

    await prisma.client.delete({ where: { id: clientId } });

    return { success: true };
  }
}