
import { Request, Response } from 'express';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import logger from '../../utils/logger';
import * as customersService from './customers.service';
import { buildSuccessResponse, buildErrorResponse, transformCustomerToResponse } from './customers.utils';
import type { CustomerCreateInput, CustomerUpdateInput, CustomerQuickCreateInput } from './customers.types';

export const listCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await customersService.listCustomers();
    const payload = customersService.mapCustomersToResponse(customers);
    res.json(buildSuccessResponse('Customers retrieved successfully', payload));
  } catch (error) {
    handleControllerError(error, res, 'Failed to list customers');
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await customersService.findCustomerById(req.params.id);
    if (!customer) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
        .json(buildErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
      return;
    }

    res.json(buildSuccessResponse('Customer retrieved successfully', transformCustomerToResponse(customer)));
  } catch (error) {
    handleControllerError(error, res, 'Failed to retrieve customer');
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const payload = req.body as CustomerCreateInput;
    const customer = await customersService.createCustomer(payload);
    res.json(buildSuccessResponse('Customer created successfully', transformCustomerToResponse(customer)));
  } catch (error) {
    handleControllerError(error, res, 'Failed to create customer');
  }
};

export const upsertCustomerQuick = async (req: Request, res: Response) => {
  try {
    const payload = req.body as CustomerQuickCreateInput;
    const result = await customersService.upsertCustomerByIdCard(payload);
    res.json(buildSuccessResponse('Customer saved successfully', transformCustomerToResponse(result.customer)));
  } catch (error) {
    handleControllerError(error, res, 'Failed to upsert customer');
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const payload = req.body as CustomerUpdateInput;
    const updated = await customersService.updateCustomer(req.params.id, payload);

    if (!updated) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
        .json(buildErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
      return;
    }

    res.json(buildSuccessResponse('Customer updated successfully', transformCustomerToResponse(updated)));
  } catch (error) {
    handleControllerError(error, res, 'Failed to update customer');
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const deleted = await customersService.deleteCustomer(req.params.id);
    if (!deleted) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND)
        .json(buildErrorResponse(ERROR_MESSAGES.CUSTOMER.NOT_FOUND));
      return;
    }

    res.json(buildSuccessResponse('Customer deleted successfully', null));
  } catch (error) {
    handleControllerError(error, res, 'Failed to delete customer');
  }
};

function handleControllerError(error: unknown, res: Response, logMessage: string): void {
  if (error instanceof customersService.CustomerServiceError) {
    res.status(error.status).json(buildErrorResponse(error.message));
    return;
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`);
  res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(buildErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR));
}
