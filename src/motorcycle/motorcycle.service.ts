import prisma from "../lib/prisma";
import { MotorcycleDTO, MotorcycleFilters } from "./motorcycle.types";
import type { motorcycle as MotorcycleModel, reminder_channel } from "@prisma/client";
import { NotificationService } from "../notifications/notification.service";

function normalizePositiveInt(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${field} inválido`);
  }
  return n;
}

function normalizeOptionalInt(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("Valor numérico inválido");
  }
  return n;
}

function normalizePage(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export class MotorcycleService {
  private static async ensureClientExists(clientId: number) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      throw new Error("Cliente no encontrado");
    }
  }

  private static async syncNextMaintenanceReminder(moto: MotorcycleModel, serviceId?: number) {
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

    // Si el frontend no mandó serviceId, no podemos crear el recordatorio
    // porque el esquema ahora lo exige. Ignoramos la creación silenciosamente.
    if (!serviceId) return;

    const existing = await prisma.reminder.findFirst({
      where: {
        motorcycleId: moto.id,
        status: "PENDIENTE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existing) {
      await prisma.reminder.update({
        where: { id: existing.id },
        data: {
          clientId: moto.clientId,
          targetDate: new Date(moto.nextMaintenanceDate),
          serviceId: serviceId,
          channel: existing.channel,
        },
      });
    } else {
      await prisma.reminder.create({
        data: {
          clientId: moto.clientId,
          motorcycleId: moto.id,
          serviceId: serviceId,
          targetDate: new Date(moto.nextMaintenanceDate),
          channel: "WHATSAPP" as reminder_channel,
          status: "PENDIENTE",
          notes: "Autogenerado al registrar o editar vehículo",
        },
      });
    }
  }

  static async create(data: MotorcycleDTO, currentUserId: number) {
    const clientId = normalizePositiveInt(data.clientId, "clientId");
    await this.ensureClientExists(clientId);

    const moto = await prisma.motorcycle.create({
      data: {
        clientId,
        type: data.type ?? "MOTO",
        brand: data.brand?.trim(),
        model: data.model?.trim(),
        year: normalizeOptionalInt(data.year),
        plate: data.plate?.trim() || null,
        color: data.color?.trim() || null,
        vin: data.vin?.trim() || null,
        mileageKm: normalizeOptionalInt(data.mileageKm),
        hoursUsed: normalizeOptionalInt(data.hoursUsed),
        nextMaintenanceDate: data.nextMaintenanceDate
          ? new Date(data.nextMaintenanceDate)
          : null,
        notes: data.notes?.trim() || null,
      },
      include: {
        client: true,
      },
    });

    await this.syncNextMaintenanceReminder(moto, data.maintenanceServiceId);

    // Regla de Negocio: Notificar que se creó un nuevo vehículo
    await NotificationService.create({
      userId: currentUserId,
      type: "NEW_VEHICLE",
      title: "Nuevo Vehículo Registrado",
      message: `Se ha registrado una nueva ${moto.type === "MOTO" ? "motocicleta" : "cuatrimoto"} ${moto.brand} ${moto.model}.`,
      entityType: "MOTORCYCLE",
      entityId: moto.id
    }).catch(() => { /* Ignorar errores de notificación para no bloquear la creación */ });

    return moto;
  }

  static async getById(id: number) {
    const motorcycleId = normalizePositiveInt(id, "id");

    return prisma.motorcycle.findUnique({
      where: { id: motorcycleId },
      include: {
        client: true,
        workorder: {
          orderBy: { date: "desc" },
          include: {
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
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async update(id: number, data: Partial<MotorcycleDTO>) {
    const motorcycleId = normalizePositiveInt(id, "id");

    const existing = await prisma.motorcycle.findUnique({
      where: { id: motorcycleId },
    });

    if (!existing) {
      throw new Error("Vehículo no encontrado");
    }

    const nextClientId =
      data.clientId !== undefined
        ? normalizePositiveInt(data.clientId, "clientId")
        : existing.clientId;

    await this.ensureClientExists(nextClientId);

    const moto = await prisma.motorcycle.update({
      where: { id: motorcycleId },
      data: {
        clientId: nextClientId,
        type: data.type ?? existing.type,
        brand: data.brand !== undefined ? data.brand.trim() : existing.brand,
        model: data.model !== undefined ? data.model.trim() : existing.model,
        year: data.year !== undefined ? normalizeOptionalInt(data.year) : existing.year,
        plate: data.plate !== undefined ? data.plate?.trim() || null : existing.plate,
        color: data.color !== undefined ? data.color?.trim() || null : existing.color,
        vin: data.vin !== undefined ? data.vin?.trim() || null : existing.vin,
        mileageKm:
          data.mileageKm !== undefined
            ? normalizeOptionalInt(data.mileageKm)
            : existing.mileageKm,
        hoursUsed:
          data.hoursUsed !== undefined
            ? normalizeOptionalInt(data.hoursUsed)
            : existing.hoursUsed,
        nextMaintenanceDate:
          data.nextMaintenanceDate !== undefined
            ? data.nextMaintenanceDate
              ? new Date(data.nextMaintenanceDate)
              : null
            : existing.nextMaintenanceDate,
        notes: data.notes !== undefined ? data.notes?.trim() || null : existing.notes,
      },
      include: {
        client: true,
      },
    });

    await this.syncNextMaintenanceReminder(moto, data.maintenanceServiceId);
    return moto;
  }

  static async delete(id: number) {
    const motorcycleId = normalizePositiveInt(id, "id");

    const existing = await prisma.motorcycle.findUnique({
      where: { id: motorcycleId },
      include: {
        _count: {
          select: {
            workorder: true,
            reminder: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Vehículo no encontrado");
    }

    if (existing._count.workorder > 0) {
      throw new Error(
        "No se puede eliminar el vehículo porque tiene órdenes asociadas"
      );
    }

    await prisma.reminder.deleteMany({
      where: { motorcycleId },
    });

    return prisma.motorcycle.delete({ where: { id: motorcycleId } });
  }

  static async list(filters: MotorcycleFilters) {
    const {
      search = "",
      clientId,
      type,
      page = 1,
      pageSize = 10,
    } = filters;

    const currentPage = normalizePage(page, 1);
    const currentPageSize = normalizePage(pageSize, 10);
    const skip = (currentPage - 1) * currentPageSize;
    const cleanSearch = search.trim();

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (type) where.type = type;

    if (cleanSearch) {
      where.OR = [
        { brand: { contains: cleanSearch } },
        { model: { contains: cleanSearch } },
        { plate: { contains: cleanSearch } },
        { vin: { contains: cleanSearch } },
        { client: { is: { name: { contains: cleanSearch } } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.motorcycle.findMany({
        where,
        include: {
          client: true,
        },
        skip,
        take: currentPageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.motorcycle.count({ where }),
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