import type { FifoSaleResponse } from '@pharmacy-pos/shared';
import {
  createFifoContractClient,
  type FifoContractClient,
} from '@pharmacy-pos/shared';

const fifoClient: FifoContractClient = createFifoContractClient();

const extractErrorMessage = (body: unknown, fallback: string): string => {
  if (body && typeof body === 'object' && 'msg' in body && typeof (body as { msg?: unknown }).msg === 'string') {
    return (body as { msg: string }).msg;
  }
  return fallback;
};

export const getSaleFifo = async (saleId: string): Promise<FifoSaleResponse> => {
  const result = await fifoClient.getSaleFifo({
    params: { saleId },
  });

  if (result.status === 200) {
    return result.body;
  }

  const error = new Error(extractErrorMessage(result.body, 'Failed to fetch sale FIFO data'));
  (error as any).status = result.status;
  (error as any).body = result.body;
  throw error;
};
