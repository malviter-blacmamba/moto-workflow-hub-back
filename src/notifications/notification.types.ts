import type { notification_type, notification_entity_type } from "@prisma/client";

export interface NotificationFilters {
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateNotificationDTO {
  userId: number;
  type: notification_type;
  title: string;
  message: string;
  entityType?: notification_entity_type | null;
  entityId?: number | null;
}