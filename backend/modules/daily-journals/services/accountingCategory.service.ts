import { Types } from 'mongoose'
import { z } from 'zod'
import {
  accountingCategoryCreateSchema,
  accountingCategoryUpdateSchema,
} from '@pharmacy-pos/shared/schemas/zod/accounting'
import AccountingCategoryModel, {
  type AccountingCategoryDocument,
} from '../models/accountingCategory.model'

export class AccountingCategoryServiceError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message)
    this.name = 'AccountingCategoryServiceError'
  }
}

export type AccountingCategoryCreateInput = z.infer<typeof accountingCategoryCreateSchema>
export type AccountingCategoryUpdateInput = z.infer<typeof accountingCategoryUpdateSchema>

function ensureObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AccountingCategoryServiceError('提供的分類 ID 無效', 400)
  }
}

async function assertUniqueName(name: string, excludeId?: Types.ObjectId) {
  const query: Record<string, unknown> = { name }
  if (excludeId) {
    query._id = { $ne: excludeId }
  }
  const existing = await AccountingCategoryModel.findOne(query).lean().exec()
  if (existing) {
    throw new AccountingCategoryServiceError('分類名稱已存在，請使用其他名稱', 409)
  }
}

async function assertUniqueCode(code: string | undefined, excludeId?: Types.ObjectId) {
  if (!code || code.trim().length === 0) {
    return
  }
  const query: Record<string, unknown> = { code }
  if (excludeId) {
    query._id = { $ne: excludeId }
  }
  const existing = await AccountingCategoryModel.findOne(query).lean().exec()
  if (existing) {
    throw new AccountingCategoryServiceError('分類代碼已存在，請使用其他代碼', 409)
  }
}

export async function listAccountingCategories(): Promise<AccountingCategoryDocument[]> {
  return AccountingCategoryModel.find({ isActive: true }).sort({ order: 1, name: 1 }).exec()
}

export async function createAccountingCategory(
  payload: AccountingCategoryCreateInput,
): Promise<AccountingCategoryDocument> {
  await assertUniqueName(payload.name)
  await assertUniqueCode(payload.code)

  const category = await AccountingCategoryModel.create({
    name: payload.name,
    code: payload.code,
    type: payload.type,
    description: payload.description ?? '',
    order: 999,
    isActive: true,
  })

  return category
}

export async function updateAccountingCategory(
  id: string,
  payload: AccountingCategoryUpdateInput,
): Promise<AccountingCategoryDocument> {
  ensureObjectId(id)
  const category = await AccountingCategoryModel.findById(id)
  if (!category) {
    throw new AccountingCategoryServiceError('找不到對應的分類資料', 404)
  }

  const categoryId = category._id as Types.ObjectId

  if (payload.name && payload.name !== category.name) {
    await assertUniqueName(payload.name, categoryId)
    category.name = payload.name
  }

  if (payload.code !== undefined && payload.code !== category.code) {
    await assertUniqueCode(payload.code ?? undefined, categoryId)
    category.code = payload.code ?? undefined
  }

  if (payload.type !== undefined) {
    category.type = payload.type ?? undefined
  }

  if (payload.description !== undefined) {
    category.description = payload.description ?? ''
  }

  return category.save()
}

export async function deleteAccountingCategory(id: string) {
  ensureObjectId(id)
  const category = await AccountingCategoryModel.findById(id)
  if (!category) {
    throw new AccountingCategoryServiceError('找不到對應的分類資料', 404)
  }

  category.isActive = false
  await category.save()

  return { id: category._id.toString() }
}
