export interface PaginationParams {
  page: number;
  limit: number;
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
