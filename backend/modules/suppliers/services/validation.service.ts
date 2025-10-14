import type { SupplierUpsertInput } from '../suppliers.types';
import { sanitizeString } from '../utils';

const OPTIONAL_STRING_FIELDS: Array<Extract<keyof SupplierUpsertInput, string>> = [
  'code',
  'shortCode',
  'contactPerson',
  'phone',
  'email',
  'address',
  'taxId',
  'paymentTerms',
  'notes',
];

export function normalizeSupplierName(name: string | undefined): string | undefined {
  return sanitizeString(name);
}

export function buildSupplierFields(input: SupplierUpsertInput): Record<string, any> {
  const fields: Record<string, any> = {};

  const normalizedName = sanitizeString(input.name);
  if (normalizedName !== undefined) {
    fields.name = normalizedName;
  }

  for (const key of OPTIONAL_STRING_FIELDS) {
    const value = sanitizeString((input as Record<string, unknown>)[key]);
    if (value !== undefined) {
      fields[key] = value;
    }
  }

  if (input.notes === null) {
    fields.notes = '';
  }

  if (typeof (input as Record<string, unknown>).isActive === 'boolean') {
    fields.isActive = (input as Record<string, unknown>).isActive;
  }

  return fields;
}
