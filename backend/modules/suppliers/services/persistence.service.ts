import type { Document } from 'mongoose';
import Supplier from '../../../models/Supplier';
import type { SupplierRecord } from '../suppliers.types';
import type { SupplierListQuery } from './query.service';

export type SupplierDocument = Document & {
  toObject: () => SupplierRecord;
  get: (path: string) => any;
};

export async function fetchSuppliers(options: SupplierListQuery): Promise<SupplierRecord[]> {
  let query = Supplier.find(options.criteria);

  query = query.sort(options.sort);

  if (typeof options.limit === 'number') {
    query = query.limit(options.limit);
    if (typeof options.skip === 'number') {
      query = query.skip(options.skip);
    }
  }

  return query.lean();
}

export async function findSupplierById(id: string): Promise<SupplierRecord | null> {
  return Supplier.findById(id).lean();
}

export async function findSupplierDocument(id: string): Promise<SupplierDocument | null> {
  return Supplier.findById(id) as unknown as SupplierDocument | null;
}

export async function createSupplierDocument(fields: Record<string, any>): Promise<SupplierRecord> {
  const supplier = new Supplier(fields);
  const saved = await supplier.save();
  return saved.toObject();
}

export async function updateSupplierDocument(id: string, fields: Record<string, any>): Promise<SupplierRecord | null> {
  const updated = await Supplier.findByIdAndUpdate(
    id,
    { $set: fields },
    { new: true, runValidators: true, context: 'query' },
  );

  return updated ? updated.toObject() : null;
}

export async function deleteSupplierDocument(id: string): Promise<boolean> {
  const existing = await Supplier.findById(id);
  if (!existing) {
    return false;
  }

  await Supplier.findByIdAndDelete(id);
  return true;
}
