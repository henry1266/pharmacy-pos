import type {
  SupplierCreateRequest,
  SupplierResponseDto,
  SupplierUpdateRequest,
} from '../api/dto';
import type { SupplierFormState } from '../types';

export const ensureSupplierId = (supplier: SupplierResponseDto): string => {
  const candidate = (supplier as SupplierResponseDto & { id?: unknown }).id;
  if (typeof candidate === 'string' && candidate.length > 0) {
    return candidate;
  }
  return supplier._id;
};

export const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const toSupplierCreatePayload = (form: SupplierFormState): SupplierCreateRequest => ({
  name: form.name.trim(),
  code: normalizeOptionalString(form.code),
  shortCode: normalizeOptionalString(form.shortCode),
  contactPerson: normalizeOptionalString(form.contactPerson),
  phone: normalizeOptionalString(form.phone),
  email: normalizeOptionalString(form.email),
  address: normalizeOptionalString(form.address),
  taxId: normalizeOptionalString(form.taxId),
  paymentTerms: normalizeOptionalString(form.paymentTerms),
  notes: normalizeOptionalString(form.notes),
  isActive: typeof form.isActive === 'boolean' ? form.isActive : undefined,
});

export const toSupplierUpdatePayload = (form: SupplierFormState): SupplierUpdateRequest => ({
  ...toSupplierCreatePayload(form),
});

export const extractErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object') {
    const errorObject = error as { message?: unknown; data?: unknown };
    if (typeof errorObject.message === 'string' && errorObject.message.length > 0) {
      return errorObject.message;
    }
    if (typeof errorObject.data === 'string' && errorObject.data.length > 0) {
      return errorObject.data;
    }
    if (typeof errorObject.data === 'object' && errorObject.data !== null) {
      const dataRecord = errorObject.data as Record<string, unknown>;
      const messageValue = dataRecord['message'];
      if (typeof messageValue === 'string' && messageValue.length > 0) {
        return messageValue;
      }
      const errorValue = dataRecord['error'];
      if (typeof errorValue === 'string' && errorValue.length > 0) {
        return errorValue;
      }
    }
  }
  return null;
};

export const buildActionErrorMessage = (error: unknown, action: string): string => {
  const detail = extractErrorMessage(error);
  return detail ? `${action}: ${detail}` : action;
};

