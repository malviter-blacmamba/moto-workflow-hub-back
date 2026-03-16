import prisma from "../lib/prisma";
import type { Prisma, workorder_status, motorcycle_type, service_vehicleType } from "@prisma/client";
import {
  WorkOrderCreateDTO,
  WorkOrderUpdateDTO,
  WorkOrderFilters,
  WorkOrderServiceItemInput,
  WorkOrderExtraItemInput,
} from "./workorder.types";

async function generateWorkOrderCode(
  tx: Prisma.TransactionClient
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const count = await tx.workorder.count({
    where: {
      date: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
  });

  const next = count + 1;
  const seq = String(next).padStart(3, "0");
  return `OT-${year}-${seq}`;
}

function normalizePositiveInt(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${field} inválido`);
  }
  return n;
}

function normalizeMoney(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${field} inválido`);
  }
  return n;
}

async function validateClientAndVehicle(
  tx: Prisma.TransactionClient,
  clientId: number,
  motorcycleId: number
) {
  const vehicle = await tx.motorcycle.findUnique({
    where: { id: motorcycleId },
    select: {
      id: true,
      clientId: true,
      type: true,
      brand: true,
      model: true,
      plate: true,
    },
  });

  if (!vehicle) {
    throw new Error("Vehículo no encontrado");
  }

  if (vehicle.clientId !== clientId) {
    throw new Error("El vehículo no pertenece al cliente seleccionado");
  }

  return vehicle;
}

async function validateAssignedUser(
  tx: Prisma.TransactionClient,
  assignedToId?: number | null
) {
  if (!assignedToId) return null;

  const user = await tx.user.findUnique({
    where: { id: assignedToId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("Usuario asignado no encontrado");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("El usuario asignado está inactivo");
  }

  return user;
}

async function buildServiceItems(
  tx: Prisma.TransactionClient,
  items: WorkOrderServiceItemInput[] | undefined,
  allowedVehicleType: motorcycle_type
) {
  const result: {
    serviceId: number;
    quantity: number;
    unitPrice: number;
    total: number;
  }[] = [];
  let subtotal = 0;

  if (!items || items.length === 0) {
    return { result, subtotal };
  }

  for (const item of items) {
    const serviceId = normalizePositiveInt(item.serviceId, "serviceId");

    const service = await tx.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        basePrice: true,
        vehicleType: true,
      },
    });

    if (!service) {
      throw new Error(`Servicio no encontrado (id: ${serviceId})`);
    }

    if (
      (service.vehicleType as string) !== (allowedVehicleType as string) &&
      service.vehicleType !== "BOTH"
    ) {
      throw new Error(
        `El servicio (id: ${serviceId}) no corresponde al tipo de vehículo ${allowedVehicleType}`
      );
    }

    const quantity =
      item.quantity && item.quantity > 0 ? Math.trunc(item.quantity) : 1;

    const unitPrice =
      item.unitPrice !== undefined
        ? normalizeMoney(item.unitPrice, "unitPrice")
        : Number(service.basePrice);

    const total = unitPrice * quantity;
    subtotal += total;

    result.push({
      serviceId,
      quantity,
      unitPrice,
      total,
    });
  }

  return { result, subtotal };
}

function buildExtraItems(items: WorkOrderExtraItemInput[] | undefined) {
  const result: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[] = [];
  let subtotal = 0;

  if (!items || items.length === 0) {
    return { result, subtotal };
  }

  for (const item of items) {
    const name = item.name?.trim();

    if (!name) {
      throw new Error("Cada item adicional debe tener nombre");
    }

    const quantity =
      item.quantity && item.quantity > 0 ? Math.trunc(item.quantity) : 1;

    const unitPrice = normalizeMoney(item.unitPrice, "unitPrice");
    const total = unitPrice * quantity;
    subtotal += total;

    result.push({
      name,
      quantity,
      unitPrice,
      total,
    });
  }

  return { result, subtotal };
}

function getAllowedNextStatuses(current: workorder_status): workorder_status[] {
  switch (current) {
    case "INGRESADO":
      return ["EN_PROGRESO"];
    case "EN_PROGRESO":
      return ["LISTO"];
    case "LISTO":
      return ["ENTREGADO"];
    case "ENTREGADO":
      return [];
    default:
      return [];
  }
}

export class WorkOrderService {
  static async create(input: WorkOrderCreateDTO, currentUserId: number) {
    return prisma.$transaction(async (tx) => {
      const clientId = normalizePositiveInt(input.clientId, "clientId");
      const motorcycleId = normalizePositiveInt(input.motorcycleId, "motorcycleId");
      const assignedToId =
        input.assignedToId !== undefined && input.assignedToId !== null
          ? normalizePositiveInt(input.assignedToId, "assignedToId")
          : null;

      const client = await tx.client.findUnique({
        where: { id: clientId },
        select: { id: true },
      });

      if (!client) {
        throw new Error("Cliente no encontrado");
      }

      const vehicle = await validateClientAndVehicle(tx, clientId, motorcycleId);

      await validateAssignedUser(tx, assignedToId);

      const code = await generateWorkOrderCode(tx);
      const allowedVehicleType = vehicle.type;

      const servicesInput = input.services ?? [];
      const extraItemsInput = input.extraItems ?? [];

      const { result: serviceItems, subtotal: servicesSubtotal } =
        await buildServiceItems(tx, servicesInput, allowedVehicleType);

      const { result: extraItems, subtotal: extrasSubtotal } =
        buildExtraItems(extraItemsInput);

      const itemsSubtotal = servicesSubtotal + extrasSubtotal;
      const subtotal =
        input.subtotal !== undefined
          ? normalizeMoney(input.subtotal, "subtotal")
          : itemsSubtotal;

      const discount = input.discount !== undefined ? normalizeMoney(input.discount, "discount") : 0;

      const total =
        input.total !== undefined
          ? normalizeMoney(input.total, "total")
          : Math.max(0, subtotal - discount);

      const workOrder = await tx.workorder.create({
        data: {
          code,
          clientId,
          motorcycleId,
          createdById: currentUserId,
          assignedToId,
          promotionId: input.promotionId ?? null,
          status: "INGRESADO",
          notes: input.notes?.trim() || null,
          date: input.date ? new Date(input.date) : new Date(),
          subtotal,
          discount,
          total,
          deliveredAt: null,
          workorderserviceitem: {
            create: serviceItems.map((s) => ({
              serviceId: s.serviceId,
              quantity: s.quantity,
              unitPrice: s.unitPrice,
              total: s.total,
            })),
          },
          workorderextraitem: {
            create: extraItems.map((x) => ({
              name: x.name,
              quantity: x.quantity,
              unitPrice: x.unitPrice,
              total: x.total,
            })),
          },
          workorder_photo: {
            create: input.photos?.map(url => ({ url })) || [],
          }
        },
        include: {
          client: true,
          motorcycle: true,
          promotion: true,
          workorder_photo: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          workorderserviceitem: { include: { service: true } },
          workorderextraitem: true,
        },
      });

      return workOrder;
    });
  }

  static async getById(id: number) {
    const workOrderId = normalizePositiveInt(id, "id");

    return prisma.workorder.findUnique({
      where: { id: workOrderId },
      include: {
        client: true,
        motorcycle: true,
        promotion: true,
        workorder_photo: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        workorderserviceitem: { include: { service: true } },
        workorderextraitem: true,
      },
    });
  }

  static async update(id: number, input: WorkOrderUpdateDTO) {
    return prisma.$transaction(async (tx) => {
      const workOrderId = normalizePositiveInt(id, "id");

      const existing = await tx.workorder.findUnique({
        where: { id: workOrderId },
        include: {
          workorderserviceitem: true,
          workorderextraitem: true,
        },
      });

      if (!existing) {
        throw new Error("Orden de trabajo no encontrada");
      }

      const nextClientId = input.clientId ?? existing.clientId;
      const nextMotorcycleId = input.motorcycleId ?? existing.motorcycleId;
      const nextAssignedToId =
        input.assignedToId !== undefined ? input.assignedToId : existing.assignedToId;

      const client = await tx.client.findUnique({
        where: { id: nextClientId },
        select: { id: true },
      });

      if (!client) {
        throw new Error("Cliente no encontrado");
      }

      const vehicle = await validateClientAndVehicle(tx, nextClientId, nextMotorcycleId);

      if (nextAssignedToId !== null && nextAssignedToId !== undefined) {
        await validateAssignedUser(tx, nextAssignedToId);
      }

      const allowedVehicleType = vehicle.type;

      let serviceItemsData = existing.workorderserviceitem.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      }));

      let extraItemsData = existing.workorderextraitem.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      }));

      if (input.services) {
        const built = await buildServiceItems(
          tx,
          input.services,
          allowedVehicleType
        );
        serviceItemsData = built.result;
      }

      if (input.extraItems) {
        const built = buildExtraItems(input.extraItems);
        extraItemsData = built.result;
      }

      const servicesSubtotal = serviceItemsData.reduce(
        (sum, it) => sum + Number(it.total),
        0
      );
      const extrasSubtotal = extraItemsData.reduce(
        (sum, it) => sum + Number(it.total),
        0
      );
      const itemsSubtotal = servicesSubtotal + extrasSubtotal;

      const subtotal =
        input.subtotal !== undefined
          ? normalizeMoney(input.subtotal, "subtotal")
          : itemsSubtotal;

      const discount =
        input.discount !== undefined
          ? normalizeMoney(input.discount, "discount")
          : Number(existing.discount);

      const total =
        input.total !== undefined
          ? normalizeMoney(input.total, "total")
          : Math.max(0, subtotal - discount);

      const updated = await tx.workorder.update({
        where: { id: workOrderId },
        data: {
          clientId: nextClientId,
          motorcycleId: nextMotorcycleId,
          assignedToId:
            nextAssignedToId !== undefined ? nextAssignedToId : existing.assignedToId,
          promotionId: input.promotionId !== undefined ? input.promotionId : existing.promotionId,
          notes:
            input.notes !== undefined ? (input.notes?.trim() || null) : existing.notes,
          date: input.date ? new Date(input.date) : existing.date,
          subtotal,
          discount,
          total,
          workorderserviceitem: {
            deleteMany: {},
            create: serviceItemsData.map((s) => ({
              serviceId: s.serviceId,
              quantity: s.quantity,
              unitPrice: s.unitPrice,
              total: s.total,
            })),
          },
          workorderextraitem: {
            deleteMany: {},
            create: extraItemsData.map((x) => ({
              name: x.name,
              quantity: x.quantity,
              unitPrice: x.unitPrice,
              total: x.total,
            })),
          },
          ...(input.photos && {
            workorder_photo: {
              deleteMany: {},
              create: input.photos.map(url => ({ url }))
            }
          })
        },
        include: {
          client: true,
          motorcycle: true,
          promotion: true,
          workorder_photo: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          workorderserviceitem: { include: { service: true } },
          workorderextraitem: true,
        },
      });

      return updated;
    });
  }

  static async changeStatus(id: number, status: workorder_status) {
    return prisma.$transaction(async (tx) => {
      const workOrderId = normalizePositiveInt(id, "id");

      const existing = await tx.workorder.findUnique({
        where: { id: workOrderId },
        select: {
          id: true,
          status: true,
          deliveredAt: true,
        },
      });

      if (!existing) {
        throw new Error("Orden de trabajo no encontrada");
      }

      if (existing.status === status) {
        return tx.workorder.findUnique({
          where: { id: workOrderId },
          include: {
            client: true,
            motorcycle: true,
            promotion: true,
            workorder_photo: true,
            createdBy: {
              select: { id: true, name: true, email: true, role: true },
            },
            assignedTo: {
              select: { id: true, name: true, email: true, role: true },
            },
            workorderserviceitem: { include: { service: true } },
            workorderextraitem: true,
          },
        });
      }

      const allowed = getAllowedNextStatuses(existing.status as workorder_status);

      if (!allowed.includes(status)) {
        throw new Error(
          `Cambio de estado no permitido: ${existing.status} -> ${status}`
        );
      }

      const updated = await tx.workorder.update({
        where: { id: workOrderId },
        data: {
          status: status,
          deliveredAt: status === "ENTREGADO" ? new Date() : null,
        },
        include: {
          client: true,
          motorcycle: true,
          promotion: true,
          workorder_photo: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          workorderserviceitem: { include: { service: true } },
          workorderextraitem: true,
        },
      });

      return updated;
    });
  }

  static async delete(id: number) {
    return prisma.$transaction(async (tx) => {
      const workOrderId = normalizePositiveInt(id, "id");

      const existing = await tx.workorder.findUnique({
        where: { id: workOrderId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error("Orden de trabajo no encontrada");
      }

      await tx.workorder_photo.deleteMany({ where: { workOrderId: workOrderId } });
      await tx.workorderserviceitem.deleteMany({ where: { workOrderId: workOrderId } });
      await tx.workorderextraitem.deleteMany({ where: { workOrderId: workOrderId } });
      await tx.workorder.delete({ where: { id: workOrderId } });
    });
  }

  static async list(filters: WorkOrderFilters) {
    const {
      search = "",
      status,
      clientId,
      motorcycleId,
      vehicleType,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 10,
    } = filters;

    const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
    const currentPageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
    const skip = (currentPage - 1) * currentPageSize;

    const where: Prisma.workorderWhereInput = {};

    if (status) where.status = status as workorder_status;
    if (clientId) where.clientId = clientId;
    if (motorcycleId) where.motorcycleId = motorcycleId;

    if (vehicleType && vehicleType !== "BOTH") {
      where.motorcycle = {
        is: {
          type: vehicleType as unknown as motorcycle_type,
        },
      };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (search.trim()) {
      const clean = search.trim();
      where.OR = [
        { code: { contains: clean } },
        { notes: { contains: clean } },
        { client: { is: { name: { contains: clean } } } },
        { motorcycle: { is: { brand: { contains: clean } } } },
        { motorcycle: { is: { model: { contains: clean } } } },
        { motorcycle: { is: { plate: { contains: clean } } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.workorder.findMany({
        where,
        include: {
          client: true,
          motorcycle: true,
          promotion: true,
          workorder_photo: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          workorderserviceitem: { include: { service: true } },
          workorderextraitem: true,
        },
        skip,
        take: currentPageSize,
        orderBy: { date: "desc" },
      }),
      prisma.workorder.count({ where }),
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