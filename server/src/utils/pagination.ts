import type { Request } from "express";

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export function getPagination(req: Request, defaultPageSize = 20, maxPageSize = 200): PaginationParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(req.query.pageSize) || defaultPageSize));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function buildPaginatedResult<T>(items: T[], total: number, params: PaginationParams) {
  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}
