import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import type {
  SupplierCreateInput,
  SupplierUpdateInput,
  SupplierQueryInput,
  SupplierRecord,
} from './suppliers.types';
import { pickShortCode } from './utils';
import { buildSupplierListQuery } from './services/query.service';
import {
  fetchSuppliers,
  findSupplierById as findSupplierByIdFromPersistence,
  findSupplierDocument,
  createSupplierDocument,
  updateSupplierDocument,
  deleteSupplierDocument,
} from './services/persistence.service';
import {
  supplierCodeExists,
  ensureSupplierCode,
  ensureSupplierShortCode,
} from './services/code.service';
import {
  buildSupplierFields,
  normalizeSupplierName,
} from './services/validation.service';

export class SupplierServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SupplierServiceError';
  }
}

export async function listSuppliers(query: SupplierQueryInput = {}): Promise<SupplierRecord[]> {
  const listQuery = buildSupplierListQuery(query);
  return fetchSuppliers(listQuery);
}

export async function findSupplierById(id: string): Promise<SupplierRecord | null> {
  return findSupplierByIdFromPersistence(id);
}

export async function createSupplier(payload: SupplierCreateInput): Promise<SupplierRecord> {
  const normalizedName = normalizeSupplierName(payload?.name);
  if (!normalizedName) {
    throw new SupplierServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    );
  }

  const fields = buildSupplierFields({ ...payload, name: normalizedName });

  if (fields.code && await supplierCodeExists(fields.code)) {
    throw new SupplierServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.SUPPLIER.CODE_EXISTS,
    );
  }

  fields.code = await ensureSupplierCode(fields.code);
  fields.shortCode = await ensureSupplierShortCode(fields.name, fields.code, fields.shortCode);

  const supplier = await createSupplierDocument(fields);
  return supplier;
}

export async function updateSupplier(id: string, payload: SupplierUpdateInput): Promise<SupplierRecord | null> {
  const existing = await findSupplierDocument(id);
  if (!existing) {
    return null;
  }

  const fields = buildSupplierFields(payload);

  const existingCode = existing.get('code');
  if (fields.code && fields.code !== existingCode && await supplierCodeExists(fields.code)) {
    throw new SupplierServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.SUPPLIER.CODE_EXISTS,
    );
  }

  if (fields.shortCode === undefined && fields.name !== undefined) {
    const resolvedShortCode = pickShortCode(
      fields.name,
      fields.code ?? existingCode,
      existing.get('shortCode'),
    );

    if (resolvedShortCode) {
      fields.shortCode = resolvedShortCode;
    }
  }

  const sanitizedEntries = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null);

  if (sanitizedEntries.length === 0) {
    return (existing.toObject?.() ?? existing) as SupplierRecord;
  }

  const updated = await updateSupplierDocument(id, Object.fromEntries(sanitizedEntries));
  return updated;
}

export async function deleteSupplier(id: string): Promise<boolean> {
  return deleteSupplierDocument(id);
}
