import Supplier from '../../models/Supplier';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import type {
  SupplierCreateInput,
  SupplierUpdateInput,
  SupplierQueryInput,
  SupplierRecord,
  SupplierUpsertInput
} from './suppliers.types';
import { pickShortCode, sanitizeString } from './suppliers.utils';

const SORTABLE_FIELDS = new Set(['name', 'code', 'createdAt', 'updatedAt']);

export class SupplierServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SupplierServiceError';
  }
}

export async function listSuppliers(query: SupplierQueryInput = {}): Promise<SupplierRecord[]> {
  const criteria: Record<string, any> = {};

  const search = sanitizeString(query.search);
  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i');
    criteria.$or = [
      { name: pattern },
      { code: pattern },
      { shortCode: pattern },
      { contactPerson: pattern }
    ];
  }

  if (typeof query.active === 'boolean') {
    criteria.isActive = query.active;
  }

  let findQuery = Supplier.find(criteria);

  const sort: Record<string, 1 | -1> = {};
  const sortBy = sanitizeString(query.sortBy);
  const sortOrder = sanitizeString(query.sortOrder);
  if (sortBy && SORTABLE_FIELDS.has(sortBy)) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.name = 1;
  }
  findQuery = findQuery.sort(sort);

  const limit = typeof query.limit === 'number' ? clamp(query.limit, 1, 100) : undefined;
  const page = typeof query.page === 'number' ? Math.max(1, query.page) : undefined;
  if (limit !== undefined) {
    findQuery = findQuery.limit(limit);
    if (page !== undefined) {
      findQuery = findQuery.skip((page - 1) * limit);
    }
  }

  return findQuery.lean();
}

export async function findSupplierById(id: string): Promise<SupplierRecord | null> {
  return Supplier.findById(id).lean();
}

export async function createSupplier(payload: SupplierCreateInput): Promise<SupplierRecord> {
  const fields = buildSupplierFields(payload);

  if (fields.code && await supplierCodeExists(fields.code)) {
    throw new SupplierServiceError(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.SUPPLIER.CODE_EXISTS);
  }

  if (!fields.code) {
    fields.code = await generateSupplierCode();
  } else {
    fields.code = fields.code.trim();
  }

  const shortCodeCandidate = pickShortCode(fields.name, fields.code, fields.shortCode);
  fields.shortCode = shortCodeCandidate ? shortCodeCandidate.toUpperCase() : (fields.code ?? '').toUpperCase();
  if (!fields.shortCode) {
    fields.shortCode = (await generateSupplierCode()).toUpperCase();
  }

  const supplier = new Supplier(fields);
  const saved = await supplier.save();
  return saved.toObject();
}

export async function updateSupplier(id: string, payload: SupplierUpdateInput): Promise<SupplierRecord | null> {
  const existing = await Supplier.findById(id);
  if (!existing) {
    return null;
  }

  const fields = buildSupplierFields(payload);

  if (fields.code && fields.code !== existing.code && await supplierCodeExists(fields.code)) {
    throw new SupplierServiceError(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.SUPPLIER.CODE_EXISTS);
  }

  if (fields.shortCode === undefined && fields.name !== undefined) {
    fields.shortCode = pickShortCode(fields.name, fields.code ?? existing.code, existing.shortCode);
  }

  const sanitizedEntries = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null);

  if (sanitizedEntries.length === 0) {
    return existing.toObject();
  }

  const updated = await Supplier.findByIdAndUpdate(
    id,
    { $set: Object.fromEntries(sanitizedEntries) },
    { new: true, runValidators: true, context: 'query' }
  );

  return updated ? updated.toObject() : null;
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const existing = await Supplier.findById(id);
  if (!existing) {
    return false;
  }
  await Supplier.findByIdAndDelete(id);
  return true;
}

function buildSupplierFields(input: SupplierUpsertInput): Record<string, any> {
  const fields: Record<string, any> = {};

  const normalizedName = sanitizeString(input.name);
  if (normalizedName !== undefined) {
    fields.name = normalizedName;
  }

  const optionalKeys: Array<keyof SupplierUpsertInput> = [
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

async function supplierCodeExists(code: string): Promise<boolean> {
  const normalized = sanitizeString(code);
  if (!normalized) {
    return false;
  }
  const existing = await Supplier.findOne({ code: normalized });
  return Boolean(existing);
}

async function generateSupplierCode(): Promise<string> {
  const count = await Supplier.countDocuments();
  return `S${String(count + 1).padStart(5, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
