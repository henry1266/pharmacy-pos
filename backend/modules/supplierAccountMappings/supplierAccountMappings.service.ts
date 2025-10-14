import mongoose from 'mongoose';
import type { HydratedDocument, PopulateOptions } from 'mongoose';
import {
  type SupplierAccountMapping,
  type SupplierAccountMappingListQuery,
  type SupplierAccountMappingBySupplierQuery,
  type SupplierAccountMappingCreateInput,
  type SupplierAccountMappingUpdateInput,
  supplierAccountMappingEntitySchema,
} from '@pharmacy-pos/shared/schemas/zod/supplierAccountMapping';
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import SupplierAccountMappingModel, {
  type ISupplierAccountMapping,
} from '../../models/SupplierAccountMapping';
import Supplier from '../../models/Supplier';
import Account2 from '../accounting-old/models/Account2';
import logger from '../../utils/logger';

const POPULATE_CONFIG: {
  supplier: string;
  organization: string;
  account: PopulateOptions;
} = {
  supplier: 'name code',
  organization: 'name code',
  account: {
    path: 'accountMappings.accountId',
    select: 'code name accountType organizationId parentId',
    populate: [
      {
        path: 'organizationId',
        select: 'name code',
      } as PopulateOptions,
      {
        path: 'parentId',
        select: 'code name accountType parentId',
        populate: {
          path: 'parentId',
          select: 'code name accountType parentId',
        },
      } as PopulateOptions,
    ],
  },
};

export class SupplierAccountMappingsServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SupplierAccountMappingsServiceError';
  }
}

type SupplierAccountMappingDocument = HydratedDocument<ISupplierAccountMapping>;

const toStringId = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && value !== null && '_id' in value) {
    const candidate = (value as { _id?: unknown })._id;
    return typeof candidate === 'string'
      ? candidate
      : candidate instanceof mongoose.Types.ObjectId
      ? candidate.toHexString()
      : undefined;
  }
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toHexString();
  }
  return undefined;
};

const normalizeAccountMapping = (input: any) => {
  const accountDoc = input?.accountId;

  const accountId =
    typeof accountDoc === 'string'
      ? accountDoc
      : accountDoc instanceof mongoose.Types.ObjectId
      ? accountDoc.toHexString()
      : toStringId(accountDoc);

  const organizationId = toStringId(accountDoc?.organizationId);
  const parentId = toStringId(accountDoc?.parentId);

  return {
    accountId: accountId ?? '',
    accountCode: input?.accountCode ?? accountDoc?.code ?? '',
    accountName: input?.accountName ?? accountDoc?.name ?? '',
    isDefault: Boolean(input?.isDefault),
    priority: typeof input?.priority === 'number' ? input.priority : 0,
    account:
      accountDoc && accountId
        ? {
            _id: accountId,
            code: accountDoc?.code ?? input?.accountCode ?? '',
            name: accountDoc?.name ?? input?.accountName ?? '',
            accountType: accountDoc?.accountType ?? undefined,
            organizationId: organizationId,
            parentId,
          }
        : undefined,
  };
};

const transformMapping = (doc: any): SupplierAccountMapping => {
  const supplierId = toStringId(doc?.supplierId) ?? '';
  const organizationId = toStringId(doc?.organizationId) ?? '';

  const mapping: SupplierAccountMapping = {
    _id: toStringId(doc?._id) ?? '',
    supplierId,
    supplierName: doc?.supplierName ?? doc?.supplierId?.name ?? '',
    organizationId,
    organizationName: doc?.organizationId?.name ?? undefined,
    accountMappings: Array.isArray(doc?.accountMappings)
      ? doc.accountMappings.map(normalizeAccountMapping)
      : [],
    isActive: doc?.isActive ?? true,
    notes: doc?.notes ?? undefined,
    createdBy: doc?.createdBy ?? undefined,
    updatedBy: doc?.updatedBy ?? undefined,
    createdAt: doc?.createdAt ?? new Date(),
    updatedAt: doc?.updatedAt ?? new Date(),
  };

  const result = supplierAccountMappingEntitySchema.safeParse(mapping);
  if (!result.success) {
    logger.warn('SupplierAccountMapping transform failed', result.error);
    throw new SupplierAccountMappingsServiceError(
      500,
      ERROR_MESSAGES.GENERIC.SERVER_ERROR,
    );
  }

  return result.data;
};

const enrichAccountMappings = (accountIds: string[], accounts: any[]) => {
  return accountIds.map((accountId, index) => {
    const target = accounts.find(
      (account) => toStringId(account?._id) === accountId,
    );

    if (!target) {
      throw new SupplierAccountMappingsServiceError(
        400,
        'Account mapping target not found',
      );
    }

    return {
      accountId: new mongoose.Types.ObjectId(accountId),
      accountCode: target.code ?? `ACC-${accountId.slice(-6)}`,
      accountName: target.name ?? `蝘-${accountId.slice(-6)}`,
      isDefault: index === 0,
      priority: index + 1,
    };
  });
};

const validateSupplierAndAccounts = async (
  supplierId: string,
  accountIds: string[],
) => {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new SupplierAccountMappingsServiceError(400, 'Supplier not found');
  }

  const accounts = await Account2.find({ _id: { $in: accountIds } });
  if (accounts.length !== accountIds.length) {
    throw new SupplierAccountMappingsServiceError(400, 'Unable to locate requested accounts');
  }

  const firstAccount = accounts[0];
  const organizationId = toStringId(firstAccount?.organizationId);
  if (!organizationId) {
    throw new SupplierAccountMappingsServiceError(400, 'Account records must include an organization');
  }

  const hasMixedOrganization = accounts.some(
    (account) => toStringId(account.organizationId) !== organizationId,
  );
  if (hasMixedOrganization) {
    throw new SupplierAccountMappingsServiceError(
      400,
      'Only mappings within the same organization are supported',
    );
  }

  return { supplier, accounts, organizationId };
};

export const listSupplierAccountMappings = async (
  query: SupplierAccountMappingListQuery = {},
): Promise<SupplierAccountMapping[]> => {
  const conditions: Record<string, unknown> = {};
  if (query.organizationId) {
    conditions.organizationId = query.organizationId;
  }
  if (query.supplierId) {
    conditions.supplierId = query.supplierId;
  }

  const mappings = await SupplierAccountMappingModel.find(conditions)
    .populate('supplierId', POPULATE_CONFIG.supplier)
    .populate('organizationId', POPULATE_CONFIG.organization)
    .populate(POPULATE_CONFIG.account)
    .sort({ supplierName: 1, 'accountMappings.priority': 1 })
    .lean();

  return mappings.map(transformMapping);
};

export const getSupplierAccountMappingBySupplier = async (
  supplierId: string,
  query: SupplierAccountMappingBySupplierQuery = {},
): Promise<SupplierAccountMapping | null> => {
  const conditions: Record<string, unknown> = {
    supplierId,
    isActive: true,
  };

  if (query.organizationId) {
    conditions.organizationId = query.organizationId;
  }

  const mapping = await SupplierAccountMappingModel.findOne(conditions)
    .populate('supplierId', POPULATE_CONFIG.supplier)
    .populate('organizationId', POPULATE_CONFIG.organization)
    .populate(POPULATE_CONFIG.account)
    .lean();

  return mapping ? transformMapping(mapping) : null;
};

export const getSupplierAccountMappingById = async (
  id: string,
): Promise<SupplierAccountMapping | null> => {
  const mapping = await SupplierAccountMappingModel.findById(id)
    .populate('supplierId', POPULATE_CONFIG.supplier)
    .populate('organizationId', POPULATE_CONFIG.organization)
    .populate(POPULATE_CONFIG.account)
    .lean();

  return mapping ? transformMapping(mapping) : null;
};

export const createSupplierAccountMapping = async (
  payload: SupplierAccountMappingCreateInput,
): Promise<SupplierAccountMapping> => {
  const { supplier, accounts, organizationId } =
    await validateSupplierAndAccounts(payload.supplierId, payload.accountIds);

  const existing = await SupplierAccountMappingModel.findOne({
    supplierId: payload.supplierId,
    organizationId,
  });

  if (existing) {
    throw new SupplierAccountMappingsServiceError(
      400,
      'Supplier already has an account mapping for this organization',
    );
  }

  const enrichedAccountMappings = enrichAccountMappings(
    payload.accountIds,
    accounts,
  );

  const mapping = new SupplierAccountMappingModel({
    supplierId: payload.supplierId,
    supplierName: supplier.name,
    organizationId,
    accountMappings: enrichedAccountMappings,
    notes: payload.notes,
    createdBy: 'system',
    updatedBy: 'system',
  });

  const saved = await mapping.save();
  const populated = await SupplierAccountMappingModel.findById(saved._id)
    .populate('supplierId', POPULATE_CONFIG.supplier)
    .populate('organizationId', POPULATE_CONFIG.organization)
    .populate(POPULATE_CONFIG.account)
    .lean();

  return transformMapping(populated ?? saved.toObject());
};

export const updateSupplierAccountMapping = async (
  id: string,
  payload: SupplierAccountMappingUpdateInput,
): Promise<SupplierAccountMapping> => {
  const mapping = (await SupplierAccountMappingModel.findById(
    id,
  )) as SupplierAccountMappingDocument | null;

  if (!mapping) {
    throw new SupplierAccountMappingsServiceError(
      404,
      ERROR_MESSAGES.GENERIC.NOT_FOUND,
    );
  }

  const currentAccountIds = payload.accountIds;
  const { accounts, organizationId } = await validateSupplierAndAccounts(
    mapping.supplierId.toHexString(),
    currentAccountIds,
  );

  const enrichedAccountMappings = enrichAccountMappings(
    currentAccountIds,
    accounts,
  );

  mapping.accountMappings = enrichedAccountMappings as any;
  mapping.organizationId = new mongoose.Types.ObjectId(organizationId);
  if (payload.notes !== undefined) {
    mapping.notes = payload.notes;
  }
  if (typeof payload.isActive === 'boolean') {
    mapping.isActive = payload.isActive;
  }
  mapping.updatedBy = 'system';

  await mapping.save();

  const populated = await SupplierAccountMappingModel.findById(mapping._id)
    .populate('supplierId', POPULATE_CONFIG.supplier)
    .populate('organizationId', POPULATE_CONFIG.organization)
    .populate(POPULATE_CONFIG.account)
    .lean();

  return transformMapping(populated ?? mapping.toObject());
};

export const deleteSupplierAccountMapping = async (id: string): Promise<void> => {
  const mapping = await SupplierAccountMappingModel.findById(id);
  if (!mapping) {
    throw new SupplierAccountMappingsServiceError(
      404,
      ERROR_MESSAGES.GENERIC.NOT_FOUND,
    );
  }

  await mapping.deleteOne();
};









