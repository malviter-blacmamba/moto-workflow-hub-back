export interface ReportDateRange {
    dateFrom?: string;
    dateTo?: string;
}

export interface DashboardSummaryFilters extends ReportDateRange { }

export interface TopServicesFilters extends ReportDateRange {
    limit?: number;
}
