import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import Sale from '../../models/Sale';
import {
  SaleCreationRequest,
  SaleDocument,
  SaleFieldsInput,
} from './sales.types';
import {
  validateSaleCreationRequest,
  validateSaleUpdateRequest,
} from './services/validation.service';
import {
  handleInventoryForNewSale,
  handleInventoryForUpdatedSale,
} from './services/inventory.service';
import { updateCustomerPoints } from './services/customer.service';
import { generateSaleNumber, buildSaleFields } from './utils/sales.utils';

function extractNotesFromRequest(requestBody: SaleCreationRequest): string | undefined {
  if (typeof requestBody.notes === 'string') {
    return requestBody.notes;
  }

  const legacyNote = (requestBody as { note?: unknown }).note;
  return typeof legacyNote === 'string' ? legacyNote : undefined;
}

export class SaleServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SaleServiceError';
  }
}

export async function findAllSales(): Promise<SaleDocument[]> {
  return Sale.find()
    .populate('customer')
    .populate('items.product')
    .populate('cashier')
    .sort({ saleNumber: -1 })
    .lean();
}

export async function findSaleById(id: string): Promise<SaleDocument | null> {
  return Sale.findById(id)
    .populate('customer')
    .populate({ path: 'items.product', model: 'baseproduct' })
    .populate('cashier');
}

// 取得今日銷售（以伺服器當地時區為基準）
export async function findTodaySales(): Promise<SaleDocument[]> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return Sale.find({ date: { $gte: start, $lte: end } })
    .populate('customer')
    .populate('items.product')
    .populate('cashier')
    .sort({ saleNumber: -1 })
    .lean();
}

export async function createSaleRecord(requestBody: SaleCreationRequest): Promise<SaleDocument> {
  const finalSaleNumber = await generateSaleNumber(requestBody.saleNumber);
  if (!finalSaleNumber) {
    throw new SaleServiceError(
      API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.GENERIC.SERVER_ERROR,
    );
  }

  const saleFieldsInput: SaleFieldsInput = {
    saleNumber: finalSaleNumber,
    items: requestBody.items ?? [],
    totalAmount: requestBody.totalAmount ?? 0,
    paymentMethod: requestBody.paymentMethod,
    date: requestBody.date ?? undefined,
  };

  if (requestBody.customer) {
    saleFieldsInput.customer = requestBody.customer;
  }

  if (requestBody.discount !== undefined) {
    saleFieldsInput.discount = requestBody.discount;
  }

  if (requestBody.discountAmount !== undefined) {
    saleFieldsInput.discountAmount = requestBody.discountAmount;
  }

  if (requestBody.paymentStatus) {
    saleFieldsInput.paymentStatus = requestBody.paymentStatus;
  }

  const notes = extractNotesFromRequest(requestBody);
  if (notes !== undefined) {
    saleFieldsInput.notes = notes;
  }

  if (requestBody.cashier) {
    saleFieldsInput.cashier = requestBody.cashier;
  }

  if (requestBody.status) {
    saleFieldsInput.status = requestBody.status;
  }

  if (requestBody.createdBy) {
    saleFieldsInput.createdBy = requestBody.createdBy;
  }

  if (requestBody.user) {
    saleFieldsInput.user = requestBody.user;
  }

  const saleFields = buildSaleFields(saleFieldsInput);
  const sale = new Sale(saleFields);
  await sale.save();
  return sale;
}

export async function updateSaleRecord(
  saleId: string,
  requestBody: SaleCreationRequest,
  existingSale: SaleDocument,
): Promise<SaleDocument> {
  const existingSaleNumber = existingSale.saleNumber;
  if (!existingSaleNumber) {
    throw new SaleServiceError(
      API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Existing sale is missing a sale number.',
    );
  }

  const saleFieldsInput: SaleFieldsInput = {
    saleNumber: existingSaleNumber,
    items: requestBody.items ?? (existingSale.items as any),
    totalAmount: requestBody.totalAmount ?? existingSale.totalAmount,
  };

  const customerId =
    requestBody.customer ??
    ((existingSale.customer as any)?.toString?.() as string | undefined);
  if (customerId) {
    saleFieldsInput.customer = customerId;
  }

  const discount = requestBody.discount ?? existingSale.discount;
  if (discount !== undefined) {
    saleFieldsInput.discount = discount;
  }

  const discountAmount = requestBody.discountAmount ?? (existingSale as any).discountAmount;
  if (discountAmount !== undefined) {
    saleFieldsInput.discountAmount = discountAmount as number;
  }

  const paymentMethod = requestBody.paymentMethod ?? existingSale.paymentMethod;
  if (paymentMethod) {
    saleFieldsInput.paymentMethod = paymentMethod;
  }

  const paymentStatus =
    requestBody.paymentStatus ?? existingSale.paymentStatus;
  if (paymentStatus) {
    saleFieldsInput.paymentStatus = paymentStatus;
  }

  const status = requestBody.status ?? (existingSale as any).status;
  if (status) {
    saleFieldsInput.status = status;
  }

  const notes = extractNotesFromRequest(requestBody);
  if (notes !== undefined) {
    saleFieldsInput.notes = notes;
  }

  const cashierId =
    requestBody.cashier ??
    ((existingSale.cashier as any)?.toString?.() as string | undefined);
  if (cashierId) {
    saleFieldsInput.cashier = cashierId;
  }

  const createdBy =
    requestBody.createdBy ??
    ((existingSale.createdBy as any)?.toString?.() as string | undefined);
  if (createdBy) {
    saleFieldsInput.createdBy = createdBy;
  }

  const userId =
    requestBody.user ??
    ((existingSale.user as any)?.toString?.() as string | undefined);
  if (userId) {
    saleFieldsInput.user = userId;
  }

  const saleDate =
    requestBody.date ??
    (existingSale.date ? (existingSale.date as any) : undefined);
  if (saleDate) {
    saleFieldsInput.date = saleDate as string | Date;
  }

  const saleFields = buildSaleFields(saleFieldsInput);
  const updatedSale = await Sale.findByIdAndUpdate(
    saleId,
    { $set: saleFields },
    { new: true, runValidators: true },
  );

  if (!updatedSale) {
    throw new SaleServiceError(
      API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.GENERIC.NOT_FOUND,
    );
  }

  return updatedSale;
}

export async function deleteSaleRecord(saleId: string): Promise<void> {
  await Sale.findByIdAndDelete(saleId);
}

export async function processSaleCreation(requestBody: SaleCreationRequest): Promise<SaleDocument> {
  const validationResult = await validateSaleCreationRequest(requestBody);
  if (!validationResult.success) {
    throw new SaleServiceError(
      validationResult.statusCode ?? API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      validationResult.message ?? ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    );
  }

  const sale = await createSaleRecord(requestBody);
  await handleInventoryForNewSale(sale);
  await updateCustomerPoints(sale);
  return sale;
}

export async function processSaleUpdate(
  saleId: string,
  requestBody: SaleCreationRequest,
  existingSale: SaleDocument,
): Promise<SaleDocument> {
  const validationResult = await validateSaleUpdateRequest(requestBody);
  if (!validationResult.success) {
    throw new SaleServiceError(
      validationResult.statusCode ?? API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      validationResult.message ?? ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    );
  }

  const updatedSale = await updateSaleRecord(saleId, requestBody, existingSale);
  await handleInventoryForUpdatedSale(existingSale, updatedSale);
  return updatedSale;
}
