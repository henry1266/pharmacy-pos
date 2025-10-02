import { Router } from 'express';
import { initServer, createExpressEndpoints } from '@ts-rest/express';
import { salesContract } from '@pharmacy-pos/shared/api/contracts';
import type { ServerInferRequest } from '@ts-rest/core';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { mapModelItemsToApiItems } from './utils/sales.utils';
import * as salesService from './sales.service';
import type { SaleCreationRequest as ServiceSaleCreationRequest } from './sales.types';
import { SaleServiceError } from './sales.service';
import * as searchService from './services/search.service';
import { isValidObjectId } from './services/validation.service';
import { handleInventoryForDeletedSale } from './services/inventory.service';
import Sale from '../../models/Sale';
import logger from '../../utils/logger';

const server = initServer();

type ListSalesRequest = ServerInferRequest<typeof salesContract['listSales']>;
type GetSaleRequest = ServerInferRequest<typeof salesContract['getSaleById']>;
type CreateSaleRequest = ServerInferRequest<typeof salesContract['createSale']>;
type UpdateSaleRequest = ServerInferRequest<typeof salesContract['updateSale']>;
type DeleteSaleRequest = ServerInferRequest<typeof salesContract['deleteSale']>;

type SuccessMessage = typeof SUCCESS_MESSAGES.GENERIC[keyof typeof SUCCESS_MESSAGES.GENERIC];

type SuccessBody<TData> = {
  success: true;
  message: SuccessMessage | string;
  data: TData;
  timestamp: string;
};

type ErrorBody = {
  success: false;
  message: string;
  statusCode: number;
  timestamp: string;
};

type KnownErrorStatus = 400 | 404 | 500;

function mapServiceStatus(status: number): KnownErrorStatus {
  if (status === 404) {
    return 404;
  }
  if (status === 400) {
    return 400;
  }
  return 500;
}

function toApiSale(sale: any) {
  if (!sale) {
    return sale;
  }

  const plain = typeof sale.toObject === 'function' ? sale.toObject() : sale;
  const idSource = (plain as any)._id ?? (sale as any)._id;

  return {
    ...plain,
    _id: typeof idSource === 'string' ? idSource : idSource?.toString?.(),
    items: mapModelItemsToApiItems((plain as any).items ?? []),
    createdAt: plain.createdAt ?? sale.createdAt ?? new Date(),
    updatedAt: plain.updatedAt ?? sale.updatedAt ?? new Date(),
  };
}

function successResponse<TStatus extends number, TData>(status: TStatus, data: TData, message: SuccessMessage | string): { status: TStatus; body: SuccessBody<TData>; } {
  return {
    status,
    body: {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  };
}

function errorResponse<TStatus extends number>(status: TStatus, message: string): { status: TStatus; body: ErrorBody; } {
  return {
    status,
    body: {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    },
  };
}

const implementation = server.router(salesContract, {
  listSales: async ({ query }: ListSalesRequest) => {
    try {
      const { search, wildcardSearch } = query ?? {};
      let sales: any[] = [];

      if (typeof wildcardSearch === 'string' && wildcardSearch.trim().length > 0) {
        sales = await searchService.performWildcardSearch(wildcardSearch);
      } else if (typeof search === 'string' && search.trim().length > 0) {
        sales = await searchService.performRegularSearch(search);
      } else {
        sales = await salesService.findAllSales();
      }

      const data = sales.map(toApiSale);
      return successResponse(200, data, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS);
    } catch (err) {
      logger.error(`listSales failed: ${err instanceof Error ? err.message : String(err)}`);
      return errorResponse(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },

  getTodaySales: async () => {
    try {
      const sales = await salesService.findTodaySales();
      const data = sales.map(toApiSale);
      return successResponse(200, data, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS);
    } catch (err) {
      logger.error(`getTodaySales failed: ${err instanceof Error ? err.message : String(err)}`);
      return errorResponse(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },

  getSaleById: async ({ params }: GetSaleRequest) => {
    const { id } = params;

    if (!id || !isValidObjectId(id)) {
      return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
    }

    try {
      const sale = await salesService.findSaleById(id);
      if (!sale) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
      }

      return successResponse(200, toApiSale(sale), SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS);
    } catch (err) {
      logger.error(`getSaleById failed: ${err instanceof Error ? err.message : String(err)}`);
      return errorResponse(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },

  createSale: async ({ body }: CreateSaleRequest) => {
    try {
      const servicePayload = body as ServiceSaleCreationRequest;
      const sale = await salesService.processSaleCreation(servicePayload);
      const populatedSale = await salesService.findSaleById((sale as any)._id.toString());
      const apiSale = populatedSale ? toApiSale(populatedSale) : toApiSale(sale);
      return successResponse(200, apiSale, SUCCESS_MESSAGES.GENERIC.CREATED ?? 'Created');
    } catch (err) {
      if (err instanceof SaleServiceError) {
        return errorResponse(mapServiceStatus(err.status), err.message);
      }


      logger.error(`createSale failed: ${err instanceof Error ? err.message : String(err)}`);
      return errorResponse(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },

  updateSale: async ({ params, body }: UpdateSaleRequest) => {
    const { id } = params;

    if (!id || !isValidObjectId(id)) {
      return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
    }

    try {
      const existingSale = await Sale.findById(id);
      if (!existingSale) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
      }
      const servicePayload = body as ServiceSaleCreationRequest;
      const updatedSale = await salesService.processSaleUpdate(id, servicePayload, existingSale as any);
      const populatedSale = await salesService.findSaleById((updatedSale as any)._id.toString());
      const apiSale = populatedSale ? toApiSale(populatedSale) : toApiSale(updatedSale);

      return successResponse(200, apiSale, SUCCESS_MESSAGES.GENERIC.UPDATED ?? 'Updated');
    } catch (err) {
      if (err instanceof SaleServiceError) {
        return errorResponse(mapServiceStatus(err.status), err.message);
      }


      logger.error(`updateSale failed: ${err instanceof Error ? err.message : String(err)}`);
      return errorResponse(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },

  deleteSale: async ({ params }: DeleteSaleRequest) => {
    const { id } = params;

    if (!id || !isValidObjectId(id)) {
      return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
    }

    try {
      const existingSale = await Sale.findById(id);
      if (!existingSale) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
      }

      await handleInventoryForDeletedSale(existingSale as any);
      await salesService.deleteSaleRecord(id);

      return successResponse(200, { id }, SUCCESS_MESSAGES.GENERIC.DELETED ?? 'Deleted');
    } catch (err) {
      if (err instanceof SaleServiceError) {
        return errorResponse(mapServiceStatus(err.status), err.message);
      }


      logger.error(`deleteSale failed: ${err instanceof Error ? err.message : String(err)}`);
      return errorResponse(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
    }
  },
});

const router: Router = Router();
createExpressEndpoints(salesContract, implementation, router);

export default router;









