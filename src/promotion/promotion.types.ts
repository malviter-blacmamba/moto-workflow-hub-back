import type { promotion_benefitType } from "@prisma/client";

export interface PromotionFilters {
  search?: string;
  active?: boolean;
  ruleId?: number;
  benefitType?: promotion_benefitType;
  page?: number;
  pageSize?: number;
}

export interface PromotionDTO {
  name: string;
  description?: string | null;
  ruleId: number;
  visitNumber?: number | null;
  minVisits?: number | null;
  minTotalSpent?: number | null;
  benefitType: promotion_benefitType;
  benefitValue?: number | null;
  freeServiceId?: number | null;
  startDate: string | Date;
  endDate: string | Date;
  priority?: number;
  accumulable?: boolean;
  active?: boolean;
}