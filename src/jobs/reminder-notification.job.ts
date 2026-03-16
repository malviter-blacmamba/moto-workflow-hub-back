import prisma from "../lib/prisma";
import { NotificationService } from "../notifications/notification.service";

function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function endOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export async function runReminderNotificationJob() {
    const today = startOfToday();
    const day7Start = addDays(today, 7);
    const day7End = endOfDay(day7Start);

    const day1Start = addDays(today, 1);
    const day1End = endOfDay(day1Start);

    const [reminders7Days, reminders1Day, activeUsers] = await Promise.all([
        prisma.reminder.findMany({
            where: {
                status: "PENDIENTE",
                targetDate: {
                    gte: day7Start,
                    lte: day7End,
                },
            },
            include: {
                client: true,
                motorcycle: true,
                service: true,
            },
        }),
        prisma.reminder.findMany({
            where: {
                status: "PENDIENTE",
                targetDate: {
                    gte: day1Start,
                    lte: day1End,
                },
            },
            include: {
                client: true,
                motorcycle: true,
                service: true,
            },
        }),
        prisma.user.findMany({
            where: {
                status: "ACTIVE",
            },
            select: {
                id: true,
            },
        }),
    ]);

    for (const reminder of reminders7Days) {
        for (const user of activeUsers) {
            await NotificationService.createIfNotExists({
                userId: user.id,
                type: "REMINDER_7_DAYS",
                title: "Recordatorio próximo en 7 días",
                message: `${reminder.client.name} - ${reminder.motorcycle.brand} ${reminder.motorcycle.model} tiene mantenimiento programado para el ${reminder.targetDate.toLocaleDateString()}`,
                entityType: "REMINDER",
                entityId: reminder.id,
            });
        }
    }

    for (const reminder of reminders1Day) {
        for (const user of activeUsers) {
            await NotificationService.createIfNotExists({
                userId: user.id,
                type: "REMINDER_1_DAY",
                title: "Recordatorio próximo mañana",
                message: `${reminder.client.name} - ${reminder.motorcycle.brand} ${reminder.motorcycle.model} tiene mantenimiento programado mañana`,
                entityType: "REMINDER",
                entityId: reminder.id,
            });
        }
    }
}