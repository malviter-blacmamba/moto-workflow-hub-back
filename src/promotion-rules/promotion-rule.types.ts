export interface PromotionRuleFilters {
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PromotionRuleDTO {
  name: string;
  key: string;
  conditionLabel: string;
  active?: boolean;
}
