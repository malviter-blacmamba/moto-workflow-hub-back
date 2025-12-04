export type ReminderChannel = "WHATSAPP" | "EMAIL";

export type ReminderStatus = "PENDIENTE" | "ENVIADO" | "COMPLETADO";

export interface ReminderCreateDTO {
    clientId: number;
    motorcycleId: number;
    serviceId?: number | null;
    targetDate: string | Date;
    channel: ReminderChannel;
    status?: ReminderStatus;
    notes?: string | null;
}

export interface ReminderUpdateDTO {
    clientId?: number;
    motorcycleId?: number;
    serviceId?: number | null;
    targetDate?: string | Date;
    channel?: ReminderChannel;
    status?: ReminderStatus;
    notes?: string | null;
    sentAt?: string | Date | null;
}

export interface ReminderFilters {
    search?: string;
    clientId?: number;
    motorcycleId?: number;
    serviceId?: number;
    channel?: ReminderChannel;
    status?: ReminderStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}
