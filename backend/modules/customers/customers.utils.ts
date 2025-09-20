import type { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import type { CustomerResponse, CustomerRecord } from './customers.types';

const MEMBERSHIP_LEVELS = new Set(['regular', 'silver', 'gold', 'platinum']);


function normalizeDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function ensureStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
}

export function transformCustomerToResponse(customer: CustomerRecord | CustomerResponse | null): CustomerResponse {
  if (!customer) {
    throw new Error('Cannot transform empty customer');
  }
  const source: Record<string, any> = typeof (customer as any)?.toObject === 'function'
    ? (customer as any).toObject({ getters: true })
    : (customer as any);

  const createdAt = normalizeDate(source.createdAt) ?? new Date();
  const updatedAt = normalizeDate(source.updatedAt) ?? new Date();

  const response: CustomerResponse = {
    _id: String(source._id),
    name: source.name ?? '',
    createdAt,
    updatedAt,
  } as CustomerResponse;

  if (source.code !== undefined) response.code = source.code;
  if (source.phone !== undefined) response.phone = source.phone;
  if (source.email !== undefined) response.email = source.email;
  if (source.address !== undefined) response.address = source.address;
  if (source.idCardNumber !== undefined) response.idCardNumber = source.idCardNumber;

  const birthdate = normalizeDate(source.birthdate ?? source.dateOfBirth);
  if (birthdate) response.birthdate = birthdate;

  if (source.gender !== undefined) response.gender = source.gender;

  const allergies = ensureStringArray(source.allergies);
  if (allergies.length > 0) {
    response.allergies = allergies;
  } else {
    response.allergies = [];
  }

  if (source.membershipLevel) {
    const normalized = String(source.membershipLevel).toLowerCase();
    response.membershipLevel = (MEMBERSHIP_LEVELS.has(normalized) ? normalized : 'regular') as 'regular' | 'silver' | 'gold' | 'platinum';
  } else {
    response.membershipLevel = 'regular';
  }

  if (source.medicalHistory !== undefined) response.medicalHistory = source.medicalHistory;
  if (source.totalPurchases !== undefined) {
    response.totalPurchases = Number(source.totalPurchases) || 0;
  } else {
    response.totalPurchases = 0;
  }

  const lastPurchaseDate = normalizeDate(source.lastPurchaseDate);
  if (lastPurchaseDate) {
    response.lastPurchaseDate = lastPurchaseDate;
  }

  if (source.notes !== undefined) {
    response.notes = source.notes;
  } else if (source.note !== undefined) {
    response.notes = source.note;
  }

  const date = normalizeDate(source.date);
  if (date) {
    response.date = date;
  }

  return response;
}

export function buildSuccessResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date(),
  };
}

export function buildErrorResponse(message: string, error?: string): ErrorResponse {
  const base: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date(),
  } as ErrorResponse;
  return error ? ({ ...base, error } as ErrorResponse) : base;
}
