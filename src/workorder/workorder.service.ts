import prisma from "../lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  WorkOrderCreateDTO,
  WorkOrderUpdateDTO,
  WorkOrderFilters,
  WorkOrderStatus,
  WorkOrderServiceItemInput,
  WorkOrderExtraItemInput,
  WorkOrderItemInput,
  VehicleType,
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

async function buildServiceItems(
  tx: Prisma.TransactionClient,
  items: WorkOrderServiceItemInput[] | undefined,
  allowedVehicleType: VehicleType
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
    const service = await tx.service.findUnique({
      where: { id: item.serviceId },
    });

    if (!service) {
      throw new Error(`Servicio no encontrado (id: ${item.serviceId})`);
    }

    const serviceVehicleType = (service as any).vehicleType as VehicleType;

    if (serviceVehicleType !== allowedVehicleType) {
      throw new Error(
        `El servicio (id: ${item.serviceId}) no corresponde al tipo de vehículo ${allowedVehicleType}`
      );
    }

    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const unitPrice =
      typeof item.unitPrice === "number"
        ? item.unitPrice
        : Number((service as any).basePrice);

    const total = unitPrice * quantity;
    subtotal += total;

    result.push({
      serviceId: item.serviceId,
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
    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const unitPrice = item.unitPrice;
    const total = unitPrice * quantity;
    subtotal += total;

    result.push({
      name: item.name,
      quantity,
      unitPrice,
      total,
    });
  }

  return { result, subtotal };
}

function buildItemsFromUnified(items: WorkOrderItemInput[] | undefined) {
  const serviceItems: {
    serviceId: number;
    quantity: number;
    unitPrice: number;
    total: number;
  }[] = [];
  const extraItems: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[] = [];
  let subtotal = 0;

  if (!items || items.length === 0) {
    return { serviceItems, extraItems, subtotal };
  }

  for (const item of items) {
    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const unitPrice = item.unitPrice;
    const discount = item.discount ?? 0;
    const total = quantity * unitPrice - discount;
    subtotal += total;

    if (item.type === "SERVICE") {
      if (!item.serviceId) {
        throw new Error("serviceId requerido para items de tipo SERVICE");
      }

      serviceItems.push({
        serviceId: item.serviceId,
        quantity,
        unitPrice,
        total,
      });
    } else {
      extraItems.push({
        name: item.description,
        quantity,
        unitPrice,
        total,
      });
    }
  }

  return { serviceItems, extraItems, subtotal };
}

export class WorkOrderService {
  static async create(input: WorkOrderCreateDTO) {
    return prisma.$transaction(async (tx) => {
      const code = await generateWorkOrderCode(tx);

      const vehicle = await tx.motorcycle.findUnique({
        where: { id: input.motorcycleId },
      });

      if (!vehicle) {
        throw new Error("Vehículo no encontrado");
      }

      const allowedVehicleType = (vehicle as any).type as VehicleType;

      let servicesInput = input.services ?? [];
      let extraItemsInput = input.extraItems ?? [];

      if (
        servicesInput.length === 0 &&
        extraItemsInput.length === 0 &&
        input.items &&
        input.items.length > 0
      ) {
        for (const item of input.items) {
          if (item.type === "SERVICE" && item.serviceId) {
            servicesInput.push({
              serviceId: item.serviceId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            });
          } else if (item.type === "PART") {
            extraItemsInput.push({
              name: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            });
          }
        }
      }

      const { result: serviceItems, subtotal: servicesSubtotal } =
        await buildServiceItems(tx, servicesInput, allowedVehicleType);

      const { result: extraItems, subtotal: extrasSubtotal } =
        buildExtraItems(extraItemsInput);

      const itemsSubtotal = servicesSubtotal + extrasSubtotal;

      const subtotal =
        typeof input.subtotal === "number" ? input.subtotal : itemsSubtotal;

      const total = typeof input.total === "number" ? input.total : subtotal;

      const workOrder = await tx.workorder.create({
        data: {
          code,
          clientId: input.clientId,
          motorcycleId: input.motorcycleId,
          status: (input.status ?? "INGRESADO") as any,
          notes: input.notes ?? null,
          date: input.date ? new Date(input.date) : new Date(),
          subtotal: subtotal as any,
          total: total as any,
          updatedAt: new Date(),
          workorderserviceitem: {
            create: serviceItems.map((s) => ({
              serviceId: s.serviceId,
              quantity: s.quantity,
              unitPrice: s.unitPrice as any,
              total: s.total as any,
            })),
          },
          workorderextraitem: {
            create: extraItems.map((x) => ({
              name: x.name,
              quantity: x.quantity,
              unitPrice: x.unitPrice as any,
              total: x.total as any,
            })),
          },
        },
        include: {
          client: true,
          motorcycle: true,
          workorderserviceitem: { include: { service: true } },
          workorderextraitem: true,
        },
      });

      return workOrder;
    });
  }

  static async getById(id: number) {
    return prisma.workorder.findUnique({
      where: { id },
      include: {
        client: true,
        motorcycle: true,
        workorderserviceitem: { include: { service: true } },
        workorderextraitem: true,
      },
    });
  }

  static async update(id: number, input: WorkOrderUpdateDTO) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.workorder.findUnique({
        where: { id },
        include: {
          workorderserviceitem: true,
          workorderextraitem: true,
        },
      });

      if (!existing) {
        throw new Error("Orden de trabajo no encontrada");
      }

      const nextMotorcycleId = input.motorcycleId ?? existing.motorcycleId;

      const vehicle = await tx.motorcycle.findUnique({
        where: { id: nextMotorcycleId },
      });

      if (!vehicle) {
        throw new Error("Vehículo no encontrado");
      }

      const allowedVehicleType = (vehicle as any).type as VehicleType;

      let serviceItemsData = (existing as any).workorderserviceitem as any[];
      let extraItemsData = (existing as any).workorderextraitem as any[];

      if (input.items && input.items.length > 0) {
        const built = buildItemsFromUnified(input.items);

        if (built.serviceItems.length > 0) {
          const { result } = await buildServiceItems(
            tx,
            built.serviceItems.map((s) => ({
              serviceId: s.serviceId,
              quantity: s.quantity,
              unitPrice: s.unitPrice,
            })),
            allowedVehicleType
          );

          serviceItemsData = result as any[];
        } else {
          serviceItemsData = [];
        }

        extraItemsData = built.extraItems as any[];
      } else {
        if (input.services) {
          const built = await buildServiceItems(
            tx,
            input.services,
            allowedVehicleType
          );
          serviceItemsData = built.result as any[];
        }

        if (input.extraItems) {
          const built = buildExtraItems(input.extraItems);
          extraItemsData = built.result as any[];
        }
      }

      const servicesSubtotal = serviceItemsData.reduce(
        (sum, it: any) => sum + Number(it.total),
        0
      );
      const extrasSubtotal = extraItemsData.reduce(
        (sum, it: any) => sum + Number(it.total),
        0
      );
      const itemsSubtotal = servicesSubtotal + extrasSubtotal;

      const subtotal =
        typeof input.subtotal === "number" ? input.subtotal : itemsSubtotal;

      const total = typeof input.total === "number" ? input.total : subtotal;

      if (input.items && input.items.length > 0) {
        await tx.workorderserviceitem.deleteMany({
          where: { workOrderId: id },
        });
        await tx.workorderextraitem.deleteMany({ where: { workOrderId: id } });
      } else {
        if (input.services) {
          await tx.workorderserviceitem.deleteMany({
            where: { workOrderId: id },
          });
        }
        if (input.extraItems) {
          await tx.workorderextraitem.deleteMany({
            where: { workOrderId: id },
          });
        }
      }

      const updated = await tx.workorder.update({
        where: { id },
        data: {
          clientId: input.clientId ?? existing.clientId,
          motorcycleId: nextMotorcycleId,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          status: (input.status ?? existing.status) as any,
          date: input.date ? new Date(input.date) : existing.date,
          subtotal: subtotal as any,
          total: total as any,
          workorderserviceitem: {
            deleteMany: {},
            create: serviceItemsData.map((s: any) => ({
              serviceId: s.serviceId,
              quantity: s.quantity,
              unitPrice: s.unitPrice as any,
              total: s.total as any,
            })),
          },
          workorderextraitem: {
            deleteMany: {},
            create: extraItemsData.map((x: any) => ({
              name: x.name,
              quantity: x.quantity,
              unitPrice: x.unitPrice as any,
              total: x.total as any,
            })),
          },
        },
        include: {
          client: true,
          motorcycle: true,
          workorderserviceitem: { include: { service: true } },
          workorderextraitem: true,
        },
      });

      return updated;
    });
  }

  static async changeStatus(id: number, status: WorkOrderStatus) {
    return prisma.workorder.update({
      where: { id },
      data: { status: status as any },
    });
  }

  static async delete(id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.workorderserviceitem.deleteMany({ where: { workOrderId: id } });
      await tx.workorderextraitem.deleteMany({ where: { workOrderId: id } });
      await tx.workorder.delete({ where: { id } });
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

    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (motorcycleId) where.motorcycleId = motorcycleId;

    if (vehicleType) {
      where.motorcycle = { type: vehicleType };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (search) {
      const clean = search.trim();
      where.OR = [
        { code: { contains: clean } },
        { client: { name: { contains: clean } } },
        { notes: { contains: clean } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.workorder.findMany({
        where,
        include: {
          client: true,
          motorcycle: true,
          workorderserviceitem: { include: { service: true } },
          workorderextraitem: true,
        },
        skip,
        take: pageSize,
        orderBy: { date: "desc" },
      }),
      prisma.workorder.count({ where }),
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
