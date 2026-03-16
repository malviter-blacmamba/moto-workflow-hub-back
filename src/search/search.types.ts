export type SearchEntityType = "CLIENT" | "MOTORCYCLE" | "WORKORDER";

export interface GlobalSearchFilters {
    q: string;
    limit?: number;
}

export interface SearchResultItem {
    type: SearchEntityType;
    id: number;
    title: string;
    subtitle?: string | null;
    meta?: Record<string, unknown>;
}