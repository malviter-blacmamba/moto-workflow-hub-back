import { reminder_channel, reminder_status } from "@prisma/client";

export interface ReminderCreateDTO {
    clientId: number;
    motorcycleId: number;
    serviceId: number;
    targetDate: string | Date;
    channel: reminder_channel;
    status?: reminder_status;
    notes?: string | null;
}

export interface ReminderUpdateDTO {
    clientId?: number;
    motorcycleId?: number;
    serviceId?: number | null;
    targetDate?: string | Date;
    channel?: reminder_channel;
    status?: reminder_status;
    sentAt?: string | Date | null;
    notes?: string | null;
}

export interface ReminderFilters {
    search?: string;
    clientId?: number;
    motorcycleId?: number;
    serviceId?: number;
    channel?: reminder_channel;
    status?: reminder_status;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}