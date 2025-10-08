import { Types } from 'mongoose'
import { format } from 'date-fns'
import { z } from 'zod'
import {
  accountingRecordCreateSchema,
  accountingRecordUpdateSchema,
  accountingSearchSchema,
  accountingItemSchema,
  unaccountedSaleSchema,
} from '@pharmacy-pos/shared/schemas/zod/accounting'
import AccountingModel, {
  type AccountingDocument,
  type AccountingItemDocument,
  type AccountingShift,
  type AccountingStatus,
} from '../models/accounting.model'
import Inventory from '../../../models/Inventory'
import BaseProduct from '../../../models/BaseProduct'
import MonitoredProduct from '../../../models/MonitoredProduct'

export class AccountingServiceError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message)
    this.name = 'AccountingServiceError'
  }
}

export const AccountingItemInputSchema = accountingItemSchema
export type AccountingItemInput = z.infer<typeof AccountingItemInputSchema>
export type AccountingRecordCreateInput = z.infer<typeof accountingRecordCreateSchema>
export type AccountingRecordUpdateInput = z.infer<typeof accountingRecordUpdateSchema>
export type AccountingSearchInput = z.infer<typeof accountingSearchSchema>
export type UnaccountedSale = z.infer<typeof unaccountedSaleSchema>

type InventorySale = {
  _id: Types.ObjectId
  product: Types.ObjectId
  quantity: number
  totalAmount: number
  saleNumber?: string
  lastUpdated: Date
}

type ProductInfo = {
  _id: Types.ObjectId
  code?: string
  shortCode?: string
  name?: string
}

type MonitoredContext = {
  productIds: Types.ObjectId[]
  productMap: Map<string, ProductInfo>
}

type AccountingQuery = {
  date?: { $gte?: Date; $lte?: Date }
  shift?: string
  $or?: Array<Record<string, RegExp>>
}



function ensureValidDate(input: Date | string): Date {
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) {
    throw new AccountingServiceError('提供的日期格式無效', 400)
  }
  return date
}

function toAccountingShift(shift: unknown): AccountingShift {
  if (shift === '早' || shift === '中' || shift === '晚') {
    return shift
  }
  throw new AccountingServiceError('班別欄位格式無效', 400)
}

type LeanMonitoredProduct = {
  productCode?: string | null
}

async function buildMonitoredContext(): Promise<MonitoredContext> {
  const monitoredRaw = await MonitoredProduct.find({}, 'productCode').lean().exec()
  const monitored = (monitoredRaw ?? []) as LeanMonitoredProduct[]

  if (!monitored || monitored.length === 0) {
    return {
      productIds: [],
      productMap: new Map(),
    }
  }

  const productCodes = monitored
    .map((entry) => entry?.productCode)
    .filter((code): code is string => typeof code === 'string' && code.trim().length > 0)

  if (productCodes.length === 0) {
    return {
      productIds: [],
      productMap: new Map(),
    }
  }

  const productsRaw = await BaseProduct.find(
    {
      $or: [{ code: { $in: productCodes } }, { shortCode: { $in: productCodes } }],
    },
    '_id code shortCode name',
  )
    .lean()
    .exec()

  const products = ((productsRaw ?? []) as unknown) as Array<{
    _id?: Types.ObjectId
    code?: string
    shortCode?: string | null
    name?: string
  }>

  const productMap = new Map<string, ProductInfo>()
  const productIds: Types.ObjectId[] = []

  for (const product of products) {
    if (!product?._id) {
      continue
    }
    const id = product._id as Types.ObjectId
    productIds.push(id)
    const payload: ProductInfo = { _id: id }
    if (product.code) {
      payload.code = product.code
    }
    if (product.shortCode) {
      payload.shortCode = product.shortCode
    }
    if (product.name) {
      payload.name = product.name
    }
    productMap.set(id.toString(), payload)
  }

  return {
    productIds,
    productMap,
  }
}

async function fetchUnaccountedSales(date: Date, context: MonitoredContext): Promise<InventorySale[]> {
  if (context.productIds.length === 0) {
    return []
  }

  let datePrefix: string
  try {
    datePrefix = format(date, 'yyyyMMdd')
  } catch (error) {
    throw new AccountingServiceError('日期格式無法轉換成查詢條件', 400)
  }

  const sales = await Inventory.find(
    {
      product: { $in: context.productIds },
      type: { $in: ['sale', 'sale-no-stock'] },
      accountingId: null,
      saleNumber: { $regex: `^${datePrefix}` },
    },
    '_id product quantity totalAmount saleNumber lastUpdated',
  )
    .sort({ lastUpdated: 1 })
    .lean()
    .exec()

  return (sales as InventorySale[]) ?? []
}

function resolveProductInfo(productId: Types.ObjectId, context: MonitoredContext): ProductInfo | undefined {
  return context.productMap.get(productId.toString())
}

function createAutoLinkedItem(sale: InventorySale, context: MonitoredContext): AccountingItemDocument {
  const productInfo = resolveProductInfo(sale.product, context)
  const productName = productInfo?.name ?? '未識別商品'
  const quantity = Math.abs(sale.quantity ?? 0)

  return {
    amount: sale.totalAmount ?? 0,
    category: '監測銷售',
    categoryId: null,
    note: `${sale.saleNumber ?? '未標號'} - ${productName}#${quantity}`,
    isAutoLinked: true,
  }
}

function toUnaccountedSale(sale: InventorySale, context: MonitoredContext): UnaccountedSale {
  const productInfo = resolveProductInfo(sale.product, context)
  return {
    _id: sale._id.toString(),
    lastUpdated: sale.lastUpdated,
    product: productInfo
      ? {
          _id: productInfo._id.toString(),
          code: productInfo.code,
          name: productInfo.name,
        }
      : undefined,
    quantity: sale.quantity,
    totalAmount: sale.totalAmount,
    saleNumber: sale.saleNumber ?? '未標號',
  }
}

function normalizeItem(item: AccountingItemInput | AccountingItemDocument): AccountingItemDocument {
  const base: AccountingItemDocument = {
    amount: item.amount ?? 0,
    category: item.category,
    categoryId: (item as AccountingItemDocument).categoryId ?? null,
    note: (item as AccountingItemDocument).note ?? (item as any).notes ?? '',
    isAutoLinked: (item as AccountingItemDocument).isAutoLinked ?? false,
  }

  return base
}

function normalizeManualItems(items: AccountingItemInput[] | undefined): AccountingItemDocument[] {
  if (!items || items.length === 0) {
    return []
  }
  return items.map((item) => normalizeItem({ ...item, isAutoLinked: false }))
}

function cloneExistingItems(items: AccountingItemDocument[]): AccountingItemDocument[] {
  return items.map((item) => ({
    amount: item.amount ?? 0,
    category: item.category,
    categoryId: item.categoryId ?? null,
    note: item.note ?? '',
    isAutoLinked: item.isAutoLinked ?? false,
  }))
}

async function unlinkAssociatedSales(accountingId: Types.ObjectId): Promise<number> {
  const result = await Inventory.updateMany({ accountingId }, { $set: { accountingId: null } }).exec()
  return result.modifiedCount ?? 0
}

function computeTotalAmount(items: AccountingItemDocument[]): number {
  return items.reduce((sum, item) => sum + (item.amount ?? 0), 0)
}

function buildSearchQuery(filters: AccountingSearchInput = {}): AccountingQuery {
  const query: AccountingQuery = {}

  if (filters.startDate || filters.endDate) {
    query.date = {}
    if (filters.startDate) {
      query.date.$gte = ensureValidDate(filters.startDate)
    }
    if (filters.endDate) {
      query.date.$lte = ensureValidDate(filters.endDate)
    }
  }

  if (filters.shift) {
    query.shift = filters.shift
  }

  if (filters.search && filters.search.trim().length > 0) {
    const regex = new RegExp(filters.search.trim(), 'i')
    query.$or = [{ 'items.category': regex }, { 'items.note': regex }]
  }

  return query
}


export async function listAccountings(filters: AccountingSearchInput = {}) {
  const query = buildSearchQuery(filters)
  return AccountingModel.find(query).sort({ date: -1, shift: 1 }).exec()
}

export async function getAccountingById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AccountingServiceError('提供的記帳記錄 ID 無效', 400)
  }
  return AccountingModel.findById(id).exec()
}

export async function getUnaccountedSalesByDate(dateInput: Date | string): Promise<UnaccountedSale[]> {
  const date = ensureValidDate(dateInput)
  const context = await buildMonitoredContext()
  const sales = await fetchUnaccountedSales(date, context)
  return sales.map((sale) => toUnaccountedSale(sale, context))
}

async function guardDuplicateRecord(date: Date, shift: AccountingShift, excludeId?: Types.ObjectId) {
  const query: Record<string, unknown> = {
    date,
    shift,
  }

  if (excludeId) {
    query._id = { $ne: excludeId }
  }

  const existing = await AccountingModel.findOne(query).lean().exec()
  if (existing) {
    throw new AccountingServiceError('相同日期與班別的記帳記錄已存在', 409)
  }
}

function mergeItems(
  manualItems: AccountingItemDocument[],
  autoItems: AccountingItemDocument[],
): AccountingItemDocument[] {
  return [...manualItems, ...autoItems]
}

export async function createAccounting(
  payload: AccountingRecordCreateInput,
  userId: string | undefined,
): Promise<AccountingDocument> {
  if (!userId) {
    throw new AccountingServiceError('找不到建立者資訊，請重新登入後再試', 401)
  }

  const date = ensureValidDate(payload.date)
  const shift = toAccountingShift(payload.shift)
  await guardDuplicateRecord(date, shift)

  const manualItems = normalizeManualItems(payload.items)

  const context = await buildMonitoredContext()
  const unaccountedSales = await fetchUnaccountedSales(date, context)
  const autoItems = unaccountedSales.map((sale) => createAutoLinkedItem(sale, context))

  const finalItems = mergeItems(manualItems, autoItems)

  if (finalItems.length === 0) {
    throw new AccountingServiceError('尚未提供任何項目，也找不到可結轉的監測銷售', 400)
  }

  const totalAmount = computeTotalAmount(finalItems)
  const status: AccountingStatus = payload.status === 'completed' ? 'completed' : 'pending'

  const accounting = await AccountingModel.create({
    date,
    shift,
    status,
    items: finalItems,
    totalAmount,
    createdBy: userId,
  })

  if (status === 'completed' && unaccountedSales.length > 0) {
    const ids = unaccountedSales.map((sale) => sale._id)
    await Inventory.updateMany({ _id: { $in: ids } }, { $set: { accountingId: accounting._id } }).exec()
  }

  return accounting
}

export async function updateAccounting(id: string, payload: AccountingRecordUpdateInput) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AccountingServiceError('提供的記帳記錄 ID 無效', 400)
  }
  const accounting = await AccountingModel.findById(id)
  if (!accounting) {
    throw new AccountingServiceError('找不到對應的記帳記錄', 404)
  }

  const targetDate = payload.date ? ensureValidDate(payload.date) : accounting.date
  const targetShift = payload.shift ? toAccountingShift(payload.shift) : (accounting.shift as AccountingShift)
  const existingId = accounting._id as Types.ObjectId

  if (payload.date || payload.shift) {
    await guardDuplicateRecord(targetDate, targetShift, existingId)
  }

  const statusBefore = accounting.status as AccountingStatus
  const statusAfter = payload.status ? (payload.status as AccountingStatus) : statusBefore
  const statusChanged = statusBefore !== statusAfter
  const hasStructuralChanges = Boolean(payload.items || payload.date || payload.shift)

  const existingItems = cloneExistingItems(accounting.items as AccountingItemDocument[])

  let nextItems = existingItems
  let linkSaleIds: Types.ObjectId[] = []

  if (hasStructuralChanges) {
    const manualItems =
      payload.items && payload.items.length > 0
        ? normalizeManualItems(payload.items)
        : existingItems.filter((item) => !item.isAutoLinked)

    await unlinkAssociatedSales(existingId)

    const context = await buildMonitoredContext()
    const unaccountedSales = await fetchUnaccountedSales(targetDate, context)
    const autoItems = unaccountedSales.map((sale) => createAutoLinkedItem(sale, context))

    nextItems = mergeItems(manualItems, autoItems)
    linkSaleIds = unaccountedSales.map((sale) => sale._id)
  } else if (statusChanged && statusAfter === 'completed' && statusBefore === 'pending') {
    const manualItems = existingItems.filter((item) => !item.isAutoLinked)

    await unlinkAssociatedSales(existingId)

    const context = await buildMonitoredContext()
    const unaccountedSales = await fetchUnaccountedSales(targetDate, context)
    const autoItems = unaccountedSales.map((sale) => createAutoLinkedItem(sale, context))

    nextItems = mergeItems(manualItems, autoItems)
    linkSaleIds = unaccountedSales.map((sale) => sale._id)
  } else if (statusChanged && statusAfter === 'pending' && statusBefore === 'completed') {
    await unlinkAssociatedSales(existingId)
    nextItems = existingItems
  }

  const totalAmount = computeTotalAmount(nextItems)

  accounting.date = targetDate
  accounting.shift = targetShift
  accounting.status = statusAfter
  accounting.items = nextItems
  accounting.totalAmount = totalAmount

  const updated = await accounting.save()

  if (statusAfter === 'completed' && linkSaleIds.length > 0) {
    await Inventory.updateMany(
      { _id: { $in: linkSaleIds } },
      { $set: { accountingId: updated._id } },
    ).exec()
  }

  return updated
}

export async function deleteAccounting(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AccountingServiceError('提供的記帳記錄 ID 無效', 400)
  }

  const accounting = await AccountingModel.findById(id)
  if (!accounting) {
    throw new AccountingServiceError('找不到對應的記帳記錄', 404)
  }

  const accountingId = accounting._id as Types.ObjectId
  await unlinkAssociatedSales(accountingId)
  await AccountingModel.findByIdAndDelete(id).exec()

  return { id }
}
