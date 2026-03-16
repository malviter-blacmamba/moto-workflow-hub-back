import { Response } from "express";
import { WorkOrderService } from "./workorder.service";
import type { workorder_status, service_vehicleType } from "@prisma/client";
import PDFDocument from "pdfkit";
import type { AuthRequest } from "../middleware/auth";

export class WorkOrderController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const workOrder = await WorkOrderService.create(req.body, req.user.id);
      res.status(201).json(workOrder);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al crear orden" });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const workOrder = await WorkOrderService.getById(id);

      if (!workOrder) {
        return res
          .status(404)
          .json({ error: "Orden de trabajo no encontrada" });
      }

      res.json(workOrder);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al obtener orden" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const workOrder = await WorkOrderService.update(id, req.body);
      res.json(workOrder);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al actualizar orden" });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      await WorkOrderService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al eliminar orden" });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const {
        search,
        status,
        clientId,
        motorcycleId,
        vehicleType,
        dateFrom,
        dateTo,
      } = req.query;

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      const result = await WorkOrderService.list({
        search: search as string | undefined,
        status: status as workorder_status | undefined,
        clientId: clientId ? Number(clientId) : undefined,
        motorcycleId: motorcycleId ? Number(motorcycleId) : undefined,
        vehicleType: vehicleType as service_vehicleType | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al listar órdenes" });
    }
  }

  static async changeStatus(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body as { status: workorder_status };
      const updated = await WorkOrderService.changeStatus(id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al cambiar estatus" });
    }
  }

  static async downloadPdf(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const workOrder = await WorkOrderService.getById(id);

      if (!workOrder) {
        return res
          .status(404)
          .json({ error: "Orden de trabajo no encontrada" });
      }

      const filename = `${workOrder.code}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      doc.pipe(res);

      doc.fontSize(20).text(`Orden de trabajo ${workOrder.code}`, {
        align: "center",
      });

      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Estado: ${workOrder.status}`);
      doc.text(`Fecha de orden: ${new Date(workOrder.date).toLocaleDateString()}`);
      doc.text(`Creada: ${new Date(workOrder.createdAt).toLocaleString()}`);
      doc.text(`Actualizada: ${new Date(workOrder.updatedAt).toLocaleString()}`);

      if (workOrder.deliveredAt) {
        doc.text(
          `Entregada: ${new Date(workOrder.deliveredAt).toLocaleString()}`
        );
      }

      doc.moveDown();
      doc.fontSize(14).text("Cliente", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Nombre: ${workOrder.client?.name ?? "-"}`);
      doc.text(`Teléfono: ${workOrder.client?.phone ?? "-"}`);
      doc.text(`Email: ${workOrder.client?.email ?? "-"}`);
      doc.text(`Dirección: ${workOrder.client?.address ?? "-"}`);

      doc.moveDown();
      doc.fontSize(14).text("Vehículo", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Marca: ${workOrder.motorcycle?.brand ?? "-"}`);
      doc.text(`Modelo: ${workOrder.motorcycle?.model ?? "-"}`);
      doc.text(`Año: ${workOrder.motorcycle?.year ?? "-"}`);
      doc.text(`Color: ${workOrder.motorcycle?.color ?? "-"}`);
      doc.text(`Placas: ${workOrder.motorcycle?.plate ?? "-"}`);
      doc.text(`VIN: ${workOrder.motorcycle?.vin ?? "-"}`);
      doc.text(`Kilometraje: ${workOrder.motorcycle?.mileageKm ?? "-"}`);

      doc.moveDown();
      doc.fontSize(14).text("Responsables", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Creó la orden: ${workOrder.createdBy?.name ?? "-"}`);
      doc.text(`Asignado a: ${workOrder.assignedTo?.name ?? "Sin asignar"}`);

      doc.moveDown();
      doc.fontSize(14).text("Servicios", { underline: true });
      doc.moveDown(0.5);

      if (workOrder.workorderserviceitem.length === 0) {
        doc.fontSize(12).text("Sin servicios registrados");
      } else {
        workOrder.workorderserviceitem.forEach((item) => {
          const name = item.service?.name ?? `Servicio #${item.serviceId}`;
          doc
            .fontSize(12)
            .text(
              `${name} x${item.quantity} - $${Number(item.total).toFixed(2)}`
            );
        });
      }

      doc.moveDown();
      doc.fontSize(14).text("Piezas / Adicionales", { underline: true });
      doc.moveDown(0.5);

      if (workOrder.workorderextraitem.length === 0) {
        doc.fontSize(12).text("Sin piezas adicionales");
      } else {
        workOrder.workorderextraitem.forEach((item) => {
          doc
            .fontSize(12)
            .text(
              `${item.name} x${item.quantity} - $${Number(item.total).toFixed(2)}`
            );
        });
      }

      doc.moveDown();
      doc.fontSize(14).text("Evidencia Fotográfica", { underline: true });
      doc.moveDown(0.5);
      if (workOrder.workorder_photo.length === 0) {
        doc.fontSize(12).text("Sin evidencia registrada al ingreso");
      } else {
        doc.fontSize(12).text(`${workOrder.workorder_photo.length} fotografía(s) adjunta(s) en el sistema.`);
      }

      doc.moveDown();
      doc.fontSize(14).text("Totales", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Subtotal: $${Number(workOrder.subtotal).toFixed(2)}`);

      if (Number(workOrder.discount) > 0) {
        const promoName = workOrder.promotion?.name ? ` (${workOrder.promotion.name})` : "";
        doc.text(`Descuento${promoName}: -$${Number(workOrder.discount).toFixed(2)}`);
      }

      doc.fontSize(12).text(`Total: $${Number(workOrder.total).toFixed(2)}`);

      if (workOrder.notes) {
        doc.moveDown();
        doc.fontSize(14).text("Notas", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(workOrder.notes);
      }

      doc.end();
    } catch {
      res.status(500).json({ error: "Error al generar el PDF" });
    }
  }
}