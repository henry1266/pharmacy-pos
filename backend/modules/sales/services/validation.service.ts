import mongoose from 'mongoose';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { createSaleSchema, updateSaleSchema } from '@pharmacy-pos/shared/schemas/zod/sale';
import Customer from '../../../models/Customer';
import BaseProduct from '../../../models/BaseProduct';
import Inventory from '../../../models/Inventory';
import logger from '../../../utils/logger';
import {
  ValidationResult,
  CustomerCheckResult,
  ProductCheckResult,
  InventoryCheckResult,
  SaleCreationRequest
} from '../sales.types';

function extractNotes(payload: SaleCreationRequest): string | undefined {
  if (typeof payload.notes === 'string' && payload.notes.trim().length > 0) {
    return payload.notes;
  }

  const legacyNote = (payload as { note?: unknown }).note;
  if (typeof legacyNote === 'string' && legacyNote.trim().length > 0) {
    return legacyNote;
  }

  return undefined;
}

export function mapToSaleSchemaInput(payload: SaleCreationRequest): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  if (payload.saleNumber !== undefined) {
    normalized.saleNumber = payload.saleNumber;
  }

  if (payload.date !== undefined) {
    normalized.date = payload.date;
  }

  if (payload.customer !== undefined) {
    normalized.customer = payload.customer;
  }

  if (Array.isArray(payload.items)) {
    normalized.items = payload.items.map((item) => {
      const normalizedItem: Record<string, unknown> = {
        product: item.product,
        quantity: item.quantity,
      };

      if (item.price !== undefined) normalizedItem.price = item.price;
      if (item.unitPrice !== undefined) normalizedItem.unitPrice = item.unitPrice;
      if (item.discount !== undefined) normalizedItem.discount = item.discount;
      if (item.subtotal !== undefined) normalizedItem.subtotal = item.subtotal;
      if (item.notes !== undefined) normalizedItem.notes = item.notes;

      return normalizedItem;
    });
  }

  if (payload.totalAmount !== undefined) {
    normalized.totalAmount = payload.totalAmount;
  }

  if (payload.discount !== undefined) {
    normalized.discount = payload.discount;
  }

  if (payload.discountAmount !== undefined) {
    normalized.discountAmount = payload.discountAmount;
  }

  if (payload.paymentMethod !== undefined) {
    normalized.paymentMethod = payload.paymentMethod;
  }

  if (payload.paymentStatus !== undefined) {
    normalized.paymentStatus = payload.paymentStatus;
  }

  const notes = extractNotes(payload);
  if (notes !== undefined) {
    normalized.notes = notes;
  }

  if (payload.cashier !== undefined) {
    normalized.cashier = payload.cashier;
  }

  return normalized;
}

function validateSaleWithSchema(payload: SaleCreationRequest, mode: 'create' | 'update'): ValidationResult {
  const schema = mode === 'create' ? createSaleSchema : updateSaleSchema;
  const normalizedPayload = mapToSaleSchemaInput(payload);
  const result = schema.safeParse(normalizedPayload);

  if (!result.success) {
    const message = result.error.errors
      ?.map((error) => error.message)
      .join('; ') || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED;

    return {
      success: false,
      statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      message,
    };
  }

  return { success: true };
}

export function isValidObjectId(id: any): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function checkCustomerExists(customerId?: string): Promise<CustomerCheckResult> {
  if (!customerId) return { exists: true };

  if (!isValidObjectId(customerId)) {
    return {
      exists: false,
      error: {
        success: false,
        statusCode: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
      },
    };
  }

  const customerExists = await Customer.findById(customerId);
  if (!customerExists) {
    return {
      exists: false,
      error: {
        success: false,
        statusCode: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        message: ERROR_MESSAGES.CUSTOMER.NOT_FOUND,
      },
    };
  }

  return { exists: true };
}

export async function checkProductExists(productId: string): Promise<ProductCheckResult> {
  if (!isValidObjectId(productId)) {
    return {
      exists: false,
      error: {
        success: false,
        statusCode: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        message: `產品ID ${productId} 無效`,
      },
    };
  }

  const product = await BaseProduct.findById(productId);
  if (!product) {
    return {
      exists: false,
      error: {
        success: false,
        statusCode: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
        message: `產品ID ${productId} 不存在`,
      },
    };
  }

  return { exists: true, product };
}

export async function checkProductInventory(product: mongoose.Document, quantity: number): Promise<InventoryCheckResult> {
  try {
    if (!isValidObjectId((product._id as any).toString())) {
      return {
        success: false,
        error: {
          success: false,
          statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          message: '產品ID 無效',
        },
      };
    }

    const productDoc = product as any;

    if (productDoc.excludeFromStock === true) {
      logger.debug(`產品 ${productDoc.name ?? '未知'} 設定為不扣庫存，略過庫存檢查`);
      return { success: true };
    }

    const inventoryQuery = Inventory.find({ product: product._id });
    const inventoriesResult = typeof (inventoryQuery as any).lean === 'function'
      ? await (inventoryQuery as any).lean()
      : await inventoryQuery;

    const inventories = Array.isArray(inventoriesResult) ? inventoriesResult : [];
    let totalQuantity = 0;
    for (const inv of inventories) {
      totalQuantity += inv.quantity ?? 0;
    }

    if (totalQuantity < quantity) {
      logger.warn(`產品 ${(product as any).name ?? '未知'} 庫存不足，當前總庫存: ${totalQuantity}，請求數量: ${quantity}`);
    }

    return { success: true };
  } catch (err) {
    logger.error(`庫存檢查錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`);
    return {
      success: false,
      error: {
        success: false,
        statusCode: API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: `庫存檢查錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`,
      },
    };
  }
}

export async function validateSaleCreationRequest(requestBody: SaleCreationRequest): Promise<ValidationResult> {
  const schemaValidation = validateSaleWithSchema(requestBody, 'create');
  if (!schemaValidation.success) {
    return schemaValidation;
  }

  const { customer, items } = requestBody;

  const customerCheck = await checkCustomerExists(customer);
  if (!customerCheck.exists && customerCheck.error) {
    return customerCheck.error;
  }

  for (const item of items ?? []) {
    const productCheck = await checkProductExists(item.product);
    if (!productCheck.exists && productCheck.error) {
      return productCheck.error;
    }

    if (productCheck.product) {
      const inventoryCheck = await checkProductInventory(productCheck.product, item.quantity);
      if (!inventoryCheck.success && inventoryCheck.error) {
        return inventoryCheck.error;
      }
    }
  }

  return { success: true };
}

export async function validateSaleUpdateRequest(requestBody: SaleCreationRequest): Promise<ValidationResult> {
  const schemaValidation = validateSaleWithSchema(requestBody, 'update');
  if (!schemaValidation.success) {
    return schemaValidation;
  }

  const { customer, items } = requestBody;

  const customerCheck = await checkCustomerExists(customer);
  if (!customerCheck.exists && customerCheck.error) {
    return customerCheck.error;
  }

  for (const item of items ?? []) {
    const productCheck = await checkProductExists(item.product);
    if (!productCheck.exists && productCheck.error) {
      return productCheck.error;
    }
  }

  return { success: true };
}


