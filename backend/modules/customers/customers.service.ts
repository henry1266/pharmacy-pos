import Customer from '../../models/Customer';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import type { CustomerCreateInput, CustomerUpdateInput, CustomerRecord, ExtendedCustomerInput } from './customers.types';
import { ensureStringArray, transformCustomerToResponse } from './customers.utils';

const MEMBERSHIP_LEVELS = new Set(['regular', 'silver', 'gold', 'platinum']);

export class CustomerServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'CustomerServiceError';
  }
}

export async function listCustomers(): Promise<CustomerRecord[]> {
  return Customer.find().sort({ name: 1 }).lean();
}

export async function findCustomerById(id: string): Promise<CustomerRecord | null> {
  return Customer.findById(id).lean();
}

export async function createCustomer(payload: CustomerCreateInput): Promise<CustomerRecord> {
  if (payload.code && await customerCodeExists(payload.code)) {
    throw new CustomerServiceError(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CUSTOMER.CODE_EXISTS);
  }

  const customerFields = buildCustomerFields(payload);
  if (!customerFields.code) {
    customerFields.code = await generateCustomerCode();
  }

  const customer = new Customer(customerFields);
  const saved = await customer.save();
  return saved.toObject();
}

export async function updateCustomer(id: string, payload: CustomerUpdateInput): Promise<CustomerRecord | null> {
  const existing = await Customer.findById(id);
  if (!existing) {
    return null;
  }

  if (payload.code && payload.code !== existing.code && await customerCodeExists(payload.code)) {
    throw new CustomerServiceError(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CUSTOMER.CODE_EXISTS);
  }

  const updateFields = buildCustomerFields(payload);
  const sanitizedEntries = Object.entries(updateFields)
    .filter(([, value]) => value !== undefined && value !== null);

  if (sanitizedEntries.length === 0) {
    return existing.toObject();
  }

  const updated = await Customer.findByIdAndUpdate(
    id,
    { $set: Object.fromEntries(sanitizedEntries) },
    { new: true, runValidators: true, context: 'query' }
  );

  return updated ? updated.toObject() : null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const existing = await Customer.findById(id);
  if (!existing) {
    return false;
  }
  await Customer.findByIdAndDelete(id);
  return true;
}

export function mapCustomersToResponse(customers: CustomerRecord[]): ReturnType<typeof transformCustomerToResponse>[] {
  return customers.map((customer) => transformCustomerToResponse(customer));
}

async function customerCodeExists(code: string): Promise<boolean> {
  if (!code) {
    return false;
  }
  const normalized = String(code).trim();
  if (!normalized) {
    return false;
  }
  const existing = await Customer.findOne({ code: normalized });
  return Boolean(existing);
}

async function generateCustomerCode(): Promise<string> {
  const customerCount = await Customer.countDocuments();
  return `C${String(customerCount + 1).padStart(5, '0')}`;
}

function buildCustomerFields(input: ExtendedCustomerInput): Record<string, any> {
  const fields: Record<string, any> = {};

  assignBasicFields(input, fields);
  assignBirthdateField(input, fields);
  assignNotesField(input, fields);
  assignAdditionalFields(input, fields);

  return fields;
}

function assignBasicFields(input: ExtendedCustomerInput, target: Record<string, any>): void {
  const { name, phone, code, email, address, gender } = input;
  if (name !== undefined) target.name = name;
  if (phone !== undefined) target.phone = phone;
  if (code !== undefined) target.code = code;
  if (email !== undefined) target.email = email;
  if (address !== undefined) target.address = address;
  if (gender !== undefined) target.gender = gender;
}

function assignBirthdateField(input: ExtendedCustomerInput, target: Record<string, any>): void {
  const candidate = input.birthdate ?? input.dateOfBirth ?? null;
  if (!candidate) {
    return;
  }
  const date = candidate instanceof Date ? candidate : new Date(candidate);
  if (!Number.isNaN(date.getTime())) {
    target.birthdate = date;
  }
}

function assignNotesField(input: ExtendedCustomerInput, target: Record<string, any>): void {
  if (input.notes !== undefined && input.notes !== null) {
    target.notes = input.notes;
    return;
  }
  if ((input as Record<string, unknown>).note !== undefined) {
    target.notes = (input as Record<string, unknown>).note;
  }
}

function assignAdditionalFields(input: ExtendedCustomerInput, target: Record<string, any>): void {
  if (input.medicalHistory !== undefined) target.medicalHistory = input.medicalHistory;
  if (input.allergies !== undefined) target.allergies = ensureStringArray(input.allergies);

  if (input.membershipLevel) {
    const normalized = String(input.membershipLevel).toLowerCase();
    target.membershipLevel = MEMBERSHIP_LEVELS.has(normalized) ? normalized : 'regular';
  }

  if (input.idCardNumber !== undefined) target.idCardNumber = input.idCardNumber;
  if ((input as Record<string, unknown>).points !== undefined) target.points = (input as Record<string, unknown>).points;
  if ((input as Record<string, unknown>).isActive !== undefined) target.isActive = (input as Record<string, unknown>).isActive;
}

