import mongoose from 'mongoose'
import ProductCategory, { type IProductCategoryDocument } from '../../../models/ProductCategory'
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
const INVALID_ID_MESSAGE = ERROR_MESSAGES.GENERIC?.INVALID_ID ?? '\u7121\u6548\u7684ID\u683C\u5F0F'
const DUPLICATE_CATEGORY_NAME_MESSAGE = '\u5206\u985E\u540D\u7A31\u5DF2\u5B58\u5728'
const CATEGORY_NOT_FOUND_MESSAGE = '\u627E\u4E0D\u5230\u6307\u5B9A\u7684\u5206\u985E'

import {
  ProductCategoryCreateInput,
  ProductCategoryDTO,
  ProductCategoryUpdateInput,
} from '../schemas/product-category.schema'

export class ProductCategoryServiceError extends Error {
  public readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ProductCategoryServiceError'
  }
}

function ensureValidObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ProductCategoryServiceError(400, INVALID_ID_MESSAGE)
  }
}

function toDTO(document: IProductCategoryDocument): ProductCategoryDTO {
  const plain = document.toObject()
  return {
    _id: plain._id.toString(),
    name: plain.name,
    description: plain.description ?? '',
    order: plain.order ?? 0,
    isActive: plain.isActive ?? true,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  }
}

function normaliseName(name?: string) {
  return name?.trim() ?? ''
}

export async function listProductCategories(): Promise<ProductCategoryDTO[]> {
  const categories = await ProductCategory.find({ isActive: { $ne: false } })
    .sort({ order: 1, name: 1 })
    .exec()

  return categories.map((category) => toDTO(category))
}

export async function getProductCategory(id: string): Promise<ProductCategoryDTO | null> {
  ensureValidObjectId(id)

  const category = await ProductCategory.findById(id)
  return category ? toDTO(category) : null
}

export async function createProductCategory(input: ProductCategoryCreateInput): Promise<ProductCategoryDTO> {
  const name = normaliseName(input.name)
  const description = input.description?.trim() ?? ''

  const existing = await ProductCategory.findOne({ name })
  if (existing) {
    throw new ProductCategoryServiceError(400, DUPLICATE_CATEGORY_NAME_MESSAGE)
  }

  const category = await ProductCategory.create({
    name,
    description,
    order: input.order ?? 999,
    isActive: input.isActive ?? true,
  })

  return toDTO(category)
}

export async function updateProductCategory(
  id: string,
  input: ProductCategoryUpdateInput,
): Promise<ProductCategoryDTO> {
  ensureValidObjectId(id)

  const category = await ProductCategory.findById(id)
  if (!category) {
    throw new ProductCategoryServiceError(404, CATEGORY_NOT_FOUND_MESSAGE)
  }

  if (input.name) {
    const name = normaliseName(input.name)
    const duplicate = await ProductCategory.findOne({ name, _id: { $ne: id } })
    if (duplicate) {
      throw new ProductCategoryServiceError(400, DUPLICATE_CATEGORY_NAME_MESSAGE)
    }
    category.name = name
  }

  if (input.description !== undefined) {
    category.description = input.description?.trim() ?? ''
  }

  if (input.isActive !== undefined) {
    category.isActive = Boolean(input.isActive)
  }

  if (input.order !== undefined) {
    category.order = Number(input.order)
  }

  await category.save()
  return toDTO(category)
}

export async function archiveProductCategory(id: string): Promise<ProductCategoryDTO> {
  ensureValidObjectId(id)

  const category = await ProductCategory.findById(id)
  if (!category) {
    throw new ProductCategoryServiceError(404, CATEGORY_NOT_FOUND_MESSAGE)
  }

  category.isActive = false
  await category.save()

  return toDTO(category)
}
