export interface ReportDateRange {
    dateFrom?: string;
    dateTo?: string;
}

export interface DashboardSummaryFilters extends ReportDateRange {
    groupBy?: "day" | "week" | "month";
}

export interface TopServicesFilters extends ReportDateRange {
    limit?: number;
}

export interface TopExtraItemsFilters extends ReportDateRange {
    limit?: number;
}