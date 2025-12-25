import { Request, Response } from "express";
import { WorkOrderService } from "./workorder.service";
import type { WorkOrderStatus } from "./workorder.types";
import PDFDocument from "pdfkit";

export class WorkOrderController {
  static async create(req: Request, res: Response) {
    try {
      const workOrder = await WorkOrderService.create(req.body);
      res.status(201).json(workOrder);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
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
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const workOrder = await WorkOrderService.update(id, req.body);
      res.json(workOrder);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await WorkOrderService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { search, status, clientId, motorcycleId, dateFrom, dateTo } =
        req.query;

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      const result = await WorkOrderService.list({
        search: search as string | undefined,
        status: status as WorkOrderStatus | undefined,
        clientId: clientId ? Number(clientId) : undefined,
        motorcycleId: motorcycleId ? Number(motorcycleId) : undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async changeStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body as { status: WorkOrderStatus };
      const updated = await WorkOrderService.changeStatus(id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async downloadPdf(req: Request, res: Response) {
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

      doc
        .fontSize(20)
        .text(`Orden de trabajo ${workOrder.code}`, { align: "center" })
        .moveDown();

      doc.fontSize(12);
      doc.text(
        `Fecha de orden: ${new Date(workOrder.date).toLocaleDateString()}`
      );
      doc.text(`Cliente: ${workOrder.client?.name ?? workOrder.clientId}`);
      doc.text(
        `Moto: ${workOrder.motorcycle?.brand ?? ""} ${
          workOrder.motorcycle?.model ?? ""
        } - ${workOrder.motorcycle?.plate ?? ""}`
      );
      doc.moveDown();

      doc.fontSize(14).text("Servicios", { underline: true });
      doc.moveDown(0.5);
      if (workOrder.services.length === 0) {
        doc.fontSize(12).text("Sin servicios registrados");
      } else {
        workOrder.services.forEach((item) => {
          const name = item.service?.name ?? `Servicio #${item.serviceId}`;
          doc
            .fontSize(12)
            .text(
              `${name}  x${item.quantity}  -  $${Number(
                item.total
              ).toLocaleString()}`
            );
        });
      }
      doc.moveDown();

      doc.fontSize(14).text("Piezas / Items adicionales", { underline: true });
      doc.moveDown(0.5);
      if (workOrder.extraItems.length === 0) {
        doc.fontSize(12).text("Sin piezas adicionales");
      } else {
        workOrder.extraItems.forEach((item) => {
          doc
            .fontSize(12)
            .text(
              `${item.name}  x${item.quantity}  -  $${Number(
                item.total
              ).toLocaleString()}`
            );
        });
      }
      doc.moveDown();

      doc.moveDown();
      doc.fontSize(14).text("Totales", { underline: true });
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .text(`Subtotal: $${Number(workOrder.subtotal).toFixed(2)}`);
      doc.fontSize(12).text(`Total: $${Number(workOrder.total).toFixed(2)}`);

      if (workOrder.notes) {
        doc.moveDown();
        doc.fontSize(14).text("Notas", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(workOrder.notes);
      }

      doc.end();
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Error al generar el PDF" });
    }
  }
}
