import mongoose from 'mongoose'
import type { IProductNote } from '../../../models/ProductNote'
import ProductNote from '../../../models/ProductNote'
import BaseProduct from '../../../models/BaseProduct'
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
const INVALID_ID_MESSAGE = ERROR_MESSAGES.GENERIC?.INVALID_ID ?? '\\u7121\\u6548\\u7684ID\\u683C\\u5F0F'
const PRODUCT_NOT_FOUND_MESSAGE = ERROR_MESSAGES.PRODUCT?.NOT_FOUND ?? '\\u627E\\u4E0D\\u5230\\u6307\\u5B9A\\u7684\\u5546\\u54C1'

import {
  emptyProductDescription,
  ProductDescriptionDTO,
  ProductDescriptionUpdateInput,
} from '../schemas/product-description.schema'

export class ProductDescriptionServiceError extends Error {
  public readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ProductDescriptionServiceError'
  }
}

function ensureValidObjectId(productId: string) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ProductDescriptionServiceError(400, INVALID_ID_MESSAGE)
  }
}

function toDTO(note?: Partial<IProductNote> | null): ProductDescriptionDTO {
  if (!note) {
    return emptyProductDescription
  }

  return {
    summary: note.summary ?? '',
    description: note.content ?? '',
    wordCount: note.wordCount ?? 0,
    summaryWordCount: note.summaryWordCount ?? 0,
    lastEditedBy: note.lastEditedBy ?? null,
    updatedAt: note.updatedAt ?? null,
    tags: note.tags ?? undefined,
    metadata: note.metadata ?? undefined,
  }
}

export async function getProductDescription(productId: string): Promise<ProductDescriptionDTO> {
  ensureValidObjectId(productId)

  const note = await ProductNote.findOne({ productId, isActive: true }).lean<IProductNote | null>()
  return toDTO(note)
}

export async function upsertProductDescription(
  productId: string,
  payload: ProductDescriptionUpdateInput,
): Promise<{ data: ProductDescriptionDTO; hasChanged: boolean }> {
  ensureValidObjectId(productId)

  const product = await BaseProduct.findById(productId)
  if (!product) {
    throw new ProductDescriptionServiceError(404, PRODUCT_NOT_FOUND_MESSAGE)
  }

  const summary = payload.summary ?? ''
  const description = payload.description ?? ''

  let productNote = await ProductNote.findOne({ productId, isActive: true })

  if (productNote && productNote.content === description && productNote.summary === summary) {
    return { data: toDTO(productNote.toObject()), hasChanged: false }
  }

  if (!productNote) {
    productNote = new ProductNote({
      productId,
      summary,
      content: description,
      contentType: 'markdown',
      lastEditedBy: 'system',
      isActive: true,
    })
  } else {
    productNote.summary = summary
    productNote.content = description
    productNote.lastEditedBy = 'system'
    productNote.isActive = true
  }

  await productNote.save()

  return { data: toDTO(productNote.toObject()), hasChanged: true }
}






