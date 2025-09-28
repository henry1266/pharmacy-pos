import type { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import type { SupplierResponse, SupplierRecord } from './suppliers.types';

function normalizeDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toPlainObject(value: SupplierRecord | SupplierResponse): Record<string, any> {
  const candidate = value as any;
  if (candidate && typeof candidate.toObject === 'function') {
    return candidate.toObject({ getters: true });
  }
  return { ...candidate };
}

export function transformSupplierToResponse(source: SupplierRecord | SupplierResponse | null): SupplierResponse {
  if (!source) {
    throw new Error('Cannot transform empty supplier record');
  }

  const candidate = toPlainObject(source);

  const createdAt = normalizeDate(candidate.createdAt) ?? new Date();
  const updatedAt = normalizeDate(candidate.updatedAt) ?? new Date();

  const response: SupplierResponse = {
    _id: String(candidate._id),
    name: candidate.name ?? '',
    createdAt,
    updatedAt,
  } as SupplierResponse;

  const responseRecord = response as unknown as Record<string, unknown>;
  const optionalKeys = [
    'code',
    'shortCode',
    'contactPerson',
    'phone',
    'email',
    'address',
    'taxId',
    'paymentTerms',
    'notes'
  ];

  for (const key of optionalKeys) {
    const normalized = normalizeString(candidate[key]);
    if (normalized !== undefined) {
      responseRecord[key] = normalized;
    }
  }

  const date = normalizeDate(candidate.date);
  if (date) {
    response.date = date;
  }

  if (typeof candidate.isActive === 'boolean') {
    response.isActive = candidate.isActive;
  }

  return response;
}

export function buildSuccessResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date()
  };
}

export function buildErrorResponse(message: string, error?: string): ErrorResponse {
  const base: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date()
  } as ErrorResponse;
  return error ? ({ ...base, error } as ErrorResponse) : base;
}

export function mapSuppliersToResponse(records: SupplierRecord[]): SupplierResponse[] {
  return records.map((record) => transformSupplierToResponse(record));
}

export function pickShortCode(name?: string, code?: string, shortCode?: string): string | undefined {
  if (shortCode && shortCode.trim().length > 0) {
    return shortCode.trim().toUpperCase();
  }
  if (code && code.trim().length > 0) {
    return code.trim().toUpperCase();
  }
  if (name && name.trim().length > 0) {
    return name.trim().slice(0, 8).toUpperCase();
  }
  return undefined;
}

export function sanitizeString(value: unknown): string | undefined {
  return normalizeString(value);
}
