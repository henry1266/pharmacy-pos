import Supplier from '../../../models/Supplier';
import { pickShortCode, sanitizeString } from '../utils';

export async function supplierCodeExists(code: string | undefined): Promise<boolean> {
  const normalized = sanitizeString(code);
  if (!normalized) {
    return false;
  }

  const existing = await Supplier.findOne({ code: normalized });
  return Boolean(existing);
}

export async function generateSupplierCode(): Promise<string> {
  const count = await Supplier.countDocuments();
  return `S${String(count + 1).padStart(5, '0')}`;
}

export async function ensureSupplierCode(code: string | undefined): Promise<string> {
  const normalized = sanitizeString(code);
  if (normalized) {
    return normalized;
  }

  return generateSupplierCode();
}

export async function ensureSupplierShortCode(
  name: string | undefined,
  code: string | undefined,
  shortCode: string | undefined,
): Promise<string> {
  const candidate = pickShortCode(name, code, shortCode);
  if (candidate) {
    return candidate.toUpperCase();
  }

  const fallbackCode = sanitizeString(code) ?? await generateSupplierCode();
  return fallbackCode.toUpperCase();
}
