import mongoose from 'mongoose';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
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

async function validateWithSharedZod(body: any, mode: 'create' | 'update'): Promise<ValidationResult> {
  try {
    const modulePath = require.resolve('@pharmacy-pos/shared/dist/schemas/zod/sale.js');
    const mod = await import(modulePath);
    const schema = mode === 'create' ? (mod as any).createSaleSchema : (mod as any).updateSaleSchema;
    const result = schema.safeParse(body);
    if (!result.success) {
      const message = result.error.errors?.map((e: any) => e.message).join('; ') || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED;
      return { success: false, statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, message };
    }
    return { success: true };
  } catch (err) {
    logger.warn(`Shared zod sale schema not applied: ${err instanceof Error ? err.message : String(err)}`);
    return { success: true };
  }
}

export function isValidObjectId(id: string): boolean {
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

    const inventories = await Inventory.find({ product: product._id }).lean();
    let totalQuantity = 0;
    for (const inv of inventories) {
      totalQuantity += inv.quantity;
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
  const structuralValidation = validateSalePayloadStructure(requestBody);
  if (!structuralValidation.success) {
    return structuralValidation;
  }

  const z = await validateWithSharedZod(requestBody, 'create');
  if (!z.success) return z;

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
  const structuralValidation = validateSalePayloadStructure(requestBody);
  if (!structuralValidation.success) {
    return structuralValidation;
  }

  const z = await validateWithSharedZod(requestBody, 'update');
  if (!z.success) return z;

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

function validateSalePayloadStructure(payload: SaleCreationRequest | undefined): ValidationResult {
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    };
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return {
      success: false,
      statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    };
  }

  for (const item of payload.items) {
    if (!item || typeof item !== 'object' || !item.product || !isValidObjectId(String(item.product))) {
      return {
        success: false,
        statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
      };
    }

    if (typeof item.quantity !== 'number' || Number.isNaN(item.quantity)) {
      return {
        success: false,
        statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
      };
    }
  }

  if (typeof payload.totalAmount !== 'number' || Number.isNaN(payload.totalAmount)) {
    return {
      success: false,
      statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    };
  }

  if (!payload.paymentMethod || typeof payload.paymentMethod !== 'string') {
    return {
      success: false,
      statusCode: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    };
  }

  return { success: true };
}
