import type { SupplierQueryInput } from '../suppliers.types';
import { sanitizeString } from '../utils';

export type SortDirection = 1 | -1;

export interface SupplierListQuery {
  criteria: Record<string, unknown>;
  sort: Record<string, SortDirection>;
  limit?: number;
  skip?: number;
}

const SORTABLE_FIELDS = new Set(['name', 'code', 'createdAt', 'updatedAt']);
const DEFAULT_SORT_FIELD = 'name';
const DEFAULT_SORT_DIRECTION: SortDirection = 1;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchCriteria(search: string | undefined) {
  if (!search) {
    return undefined;
  }

  const pattern = new RegExp(escapeRegExp(search), 'i');
  return {
    $or: [
      { name: pattern },
      { code: pattern },
      { shortCode: pattern },
      { contactPerson: pattern },
    ],
  };
}

function buildSort(sortBy: string | undefined, sortOrder: string | undefined): Record<string, SortDirection> {
  if (sortBy && SORTABLE_FIELDS.has(sortBy)) {
    return { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  }

  return { [DEFAULT_SORT_FIELD]: DEFAULT_SORT_DIRECTION };
}

function buildPagination(limitValue: number | undefined, pageValue: number | undefined) {
  if (typeof limitValue !== 'number') {
    return { limit: undefined, skip: undefined };
  }

  const limit = clamp(limitValue, MIN_LIMIT, MAX_LIMIT);
  if (typeof pageValue !== 'number') {
    return { limit, skip: undefined };
  }

  const page = Math.max(1, pageValue);
  const skip = (page - 1) * limit;
  return { limit, skip };
}

export function buildSupplierListQuery(query: SupplierQueryInput = {}): SupplierListQuery {
  const criteria: Record<string, unknown> = {};

  const search = sanitizeString(query.search);
  const searchCriteria = buildSearchCriteria(search);
  if (searchCriteria) {
    Object.assign(criteria, searchCriteria);
  }

  if (typeof query.active === 'boolean') {
    criteria.isActive = query.active;
  }

  const sortBy = sanitizeString(query.sortBy);
  const sortOrder = sanitizeString(query.sortOrder);
  const sort = buildSort(sortBy, sortOrder);

  const limitInput = typeof query.limit === 'number' ? query.limit : undefined;
  const pageInput = typeof query.page === 'number' ? query.page : undefined;
  const { limit, skip } = buildPagination(limitInput, pageInput);

  const listQuery: SupplierListQuery = {
    criteria,
    sort,
  };

  if (limit !== undefined) {
    listQuery.limit = limit;
  }

  if (skip !== undefined) {
    listQuery.skip = skip;
  }

  return listQuery;
}

export function getSortableSupplierFields(): string[] {
  return Array.from(SORTABLE_FIELDS);
}
