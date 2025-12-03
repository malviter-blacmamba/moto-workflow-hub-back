export type PromotionBenefitType =
  | "FIXED_AMOUNT"
  | "PERCENTAGE"
  | "FREE_SERVICE";

export interface PromotionFilters {
  search?: string;
  active?: boolean;
  ruleId?: number;
  benefitType?: PromotionBenefitType;
  page?: number;
  pageSize?: number;
}

export interface PromotionDTO {
  name: string;
  description?: string;

  ruleId: number;

  visitNumber?: number | null;
  minVisits?: number | null;
  minTotalSpent?: number | null;

  benefitType: PromotionBenefitType;
  benefitValue?: number | null;
  freeServiceId?: number | null;

  startDate: string | Date;
  endDate: string | Date;

  priority?: number;
  accumulable?: boolean;
  active?: boolean;
}
