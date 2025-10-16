import { z } from 'zod';



import {

  purchaseOrderFilteredListResponseSchema,

  purchaseOrderMutationResponseSchema,

  purchaseOrderDeleteResponseSchema,

  purchaseOrderErrorSchema,

  purchaseOrderErrorCodeSchema,

} from '@pharmacy-pos/shared/schemas/purchase-orders';

import type {

  PurchaseOrderSummary,

  PurchaseOrderDetail,

  PurchaseOrderError,

} from '@pharmacy-pos/shared/types/purchase-order';

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';



import logger from '../../../utils/logger';



export type PurchaseOrderErrorCode = z.infer<typeof purchaseOrderErrorCodeSchema>;



export interface HttpResponse<TBody> {

  status: number;

  body: TBody;

}



const withTimestamp = <TBody extends { timestamp?: string }>(body: TBody): TBody => ({

  ...body,

  timestamp: body.timestamp ?? new Date().toISOString(),

});



export const createSummaryListResponse = (

  summaries: PurchaseOrderSummary[],

  status: number = 200,

  message: string = SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,

): HttpResponse<PurchaseOrderSummaryListEnvelope> => {

  const body = purchaseOrderFilteredListResponseSchema.parse(

    withTimestamp({

      success: true,

      message,

      data: summaries,

    }),

  );



  return { status, body };

};



export const createDetailResponse = (

  detail: PurchaseOrderDetail,

  status: number = 200,

  message: string = SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,

): HttpResponse<PurchaseOrderMutationEnvelope> => {

  const body = purchaseOrderMutationResponseSchema.parse(

    withTimestamp({

      success: true,

      message,

      data: detail,

    }),

  );



  return { status, body };

};



export const createDeleteResponse = (

  id: string,

  status: number = 200,

  message: string = SUCCESS_MESSAGES.GENERIC.DELETED ?? 'Deleted',

): HttpResponse<PurchaseOrderDeleteEnvelope> => {

  const body = purchaseOrderDeleteResponseSchema.parse(

    withTimestamp({

      success: true,

      message,

      data: { id },

    }),

  );



  return { status, body };

};



interface ErrorResponseOptions {

  status: number;

  code: PurchaseOrderErrorCode;

  message: string;

  details?: PurchaseOrderError['details'];

  errors?: PurchaseOrderError['errors'];

}



export const createErrorResponse = ({

  status,

  code,

  message,

  details,

  errors,

}: ErrorResponseOptions): HttpResponse<PurchaseOrderError> => {

  const body = purchaseOrderErrorSchema.parse(

    withTimestamp({

      success: false,

      message,

      error: message,

      statusCode: status,

      code,

      details,

      errors,

    }),

  );



  return { status, body };

};



type PurchaseOrderSummaryListEnvelope = z.infer<typeof purchaseOrderFilteredListResponseSchema>;

type PurchaseOrderMutationEnvelope = z.infer<typeof purchaseOrderMutationResponseSchema>;

type PurchaseOrderDeleteEnvelope = z.infer<typeof purchaseOrderDeleteResponseSchema>;



const contains = (source: string | undefined, target: string): boolean =>

  (source ?? '').includes(target);



export const resolveServiceError = (rawMessage: string | undefined): ErrorResponseOptions => {

  const message = rawMessage?.trim();



  if (!message) {

    return {

      status: 400,

      code: 'VALIDATION_FAILED',

      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,

    };

  }



  if (contains(message, '?????i?f??') || contains(message.toLowerCase(), 'not found') || message.includes('???') || message.includes('???????')) {

    return {

      status: 404,

      code: 'NOT_FOUND',

      message,

    };

  }



  if (

    contains(message, '??i?f???w?s?b') ||

    contains(message, '?w???????i?f????R??') ||

    contains(message.toLowerCase(), 'already exists') ||

    contains(message.toLowerCase(), 'conflict') ||

    message.includes('???')

  ) {

    return {

      status: 409,

      code: 'CONFLICT',

      message,

    };

  }



  if (contains(message, '???{?????') || contains(message.toLowerCase(), 'unauthorized')) {

    return {

      status: 401,

      code: 'UNAUTHORIZED',

      message,

    };

  }



  if (contains(message.toLowerCase(), 'forbidden') || contains(message, '?j????')) {

    return {

      status: 403,

      code: 'FORBIDDEN',

      message,

    };

  }



  if (

    contains(message, '??~') ||

    contains(message, '?????') ||

    contains(message, '????') ||

    contains(message.toLowerCase(), 'invalid') ||

    contains(message.toLowerCase(), 'validation')

  ) {

    return {

      status: 400,

      code: 'VALIDATION_FAILED',

      message,

    };

  }



  return {

    status: 400,

    code: 'VALIDATION_FAILED',

    message,

  };

};





export const handleException = (

  error: unknown,

  context: string,

): HttpResponse<PurchaseOrderError> => {

  const message = error instanceof Error ? error.stack ?? error.message : String(error);

  logger.error(`${context}: ${message}`);

  return createErrorResponse({

    status: 500,

    code: 'SERVER_ERROR',

    message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,

  });

};

