import { ActionTypes } from './actionTypes';
import { 
  TransactionGroupWithEntries, 
  EmbeddedAccountingEntry,
  ApiResponse 
} from '@pharmacy-pos/shared';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action, RootState } from './reducers';

// API基礎URL
export const API_BASE_URL = getApiBaseUrl();

// 定義 Thunk 類型
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;

// 獲取認證配置
const getAuthConfig = () => ({
  headers: {
    'x-auth-token': localStorage.getItem('token'),
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

/**
 * 內嵌分錄交易群組相關 Action Creators
 */

// 獲取所有內嵌分錄交易群組
export const fetchTransactionGroupsWithEntries = (params?: {
  organizationId?: string;
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  fundingType?: string;
}): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 fetchTransactionGroupsWithEntries 開始:', params);
    dispatch({ type: ActionTypes.FETCH_TRANSACTION_GROUPS_WITH_ENTRIES_REQUEST });
    
    const config = {
      ...getAuthConfig(),
      params: params || {}
    };
    
    const res = await axios.get<ApiResponse<{
      groups: TransactionGroupWithEntries[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>(`${API_BASE_URL}/transaction-groups-with-entries`, config);
    
    console.log('📡 API 回應:', res.data);
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.FETCH_TRANSACTION_GROUPS_WITH_ENTRIES_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ fetchTransactionGroupsWithEntries 成功，資料筆數:', res.data.data.groups.length);
    } else {
      throw new Error(res.data.message ?? '獲取內嵌分錄交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchTransactionGroupsWithEntries 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '獲取內嵌分錄交易群組失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.FETCH_TRANSACTION_GROUPS_WITH_ENTRIES_FAILURE,
      payload: errorMessage
    });
  }
};

// 獲取單一內嵌分錄交易群組
export const fetchTransactionGroupWithEntries = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 fetchTransactionGroupWithEntries 開始:', id);
    dispatch({ type: ActionTypes.FETCH_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST });
    
    const config = getAuthConfig();
    const res = await axios.get<ApiResponse<TransactionGroupWithEntries>>(
      `${API_BASE_URL}/transaction-groups-with-entries/${id}`,
      config
    );
    
    console.log('📡 API 回應:', res.data);
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.FETCH_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ fetchTransactionGroupWithEntries 成功:', res.data.data);
    } else {
      throw new Error(res.data.message ?? '獲取內嵌分錄交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchTransactionGroupWithEntries 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '獲取內嵌分錄交易群組失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.FETCH_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE,
      payload: errorMessage
    });
  }
};

// 創建內嵌分錄交易群組
export const createTransactionGroupWithEntries = (
  transactionData: Omit<TransactionGroupWithEntries, '_id' | 'createdAt' | 'updatedAt'>
): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🚀 [Redux] createTransactionGroupWithEntries 開始:', {
      description: transactionData.description,
      organizationId: transactionData.organizationId,
      entriesCount: transactionData.entries?.length || 0,
      fundingType: transactionData.fundingType,
      hasLinkedTransactions: !!(transactionData.linkedTransactionIds?.length),
      entriesDetail: transactionData.entries?.map(entry => ({
        accountId: entry.accountId,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        description: entry.description
      }))
    });
    
    // 前端資料驗證
    if (!transactionData.description?.trim()) {
      throw new Error('交易描述不能為空');
    }
    
    if (!transactionData.entries || transactionData.entries.length < 2) {
      throw new Error('至少需要兩筆分錄');
    }
    
    // 檢查借貸平衡
    const totalDebit = transactionData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = transactionData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
      throw new Error(`借貸不平衡：借方 ${totalDebit.toFixed(2)}，貸方 ${totalCredit.toFixed(2)}`);
    }
    
    // 檢查每筆分錄的有效性
    const invalidEntries = transactionData.entries.filter(entry =>
      !entry.accountId ||
      (entry.debitAmount === 0 && entry.creditAmount === 0) ||
      (entry.debitAmount > 0 && entry.creditAmount > 0)
    );
    
    if (invalidEntries.length > 0) {
      console.error('❌ [Redux] 發現無效分錄:', invalidEntries);
      throw new Error('存在無效分錄：每筆分錄必須選擇科目且只能填入借方或貸方金額');
    }
    
    dispatch({ type: ActionTypes.CREATE_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST });
    
    const config = getAuthConfig();
    console.log('📡 [Redux] 發送 API 請求到:', `${API_BASE_URL}/transaction-groups-with-entries`);
    console.log('📡 [Redux] 請求配置:', {
      headers: config.headers,
      dataSize: JSON.stringify(transactionData).length
    });
    
    const res = await axios.post<ApiResponse<TransactionGroupWithEntries>>(
      `${API_BASE_URL}/transaction-groups-with-entries`,
      transactionData,
      config
    );
    
    console.log('📡 [Redux] 創建內嵌分錄交易群組 API 回應:', {
      status: res.status,
      success: res.data.success,
      hasData: !!res.data.data,
      message: res.data.message,
      dataId: res.data.data?._id
    });
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.CREATE_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ [Redux] createTransactionGroupWithEntries 成功:', {
        id: res.data.data._id,
        description: res.data.data.description,
        entriesCount: res.data.data.entries?.length || 0
      });
      return res.data.data;
    } else {
      const errorMsg = res.data.message ?? '建立交易群組失敗';
      console.error('❌ [Redux] API 回應失敗:', { success: res.data.success, message: errorMsg });
      throw new Error(errorMsg);
    }
  } catch (err: any) {
    console.error('❌ [Redux] createTransactionGroupWithEntries 失敗:', err);
    console.error('❌ [Redux] 錯誤詳情:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      responseData: err.response?.data,
      requestData: {
        description: transactionData.description,
        organizationId: transactionData.organizationId,
        entriesCount: transactionData.entries?.length || 0
      }
    });
    
    let errorMessage = '建立交易群組失敗';
    
    // 網路錯誤
    if (err.code === 'NETWORK_ERROR' || err.code === 'ECONNREFUSED') {
      errorMessage = '網路連線失敗，請檢查網路狀態';
    }
    // HTTP 狀態碼錯誤
    else if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.status === 400) {
      errorMessage = err.response?.data?.message || '請求資料格式錯誤';
    } else if (err.response?.status === 403) {
      errorMessage = '權限不足，無法執行此操作';
    } else if (err.response?.status === 404) {
      errorMessage = 'API 端點不存在';
    } else if (err.response?.status === 422) {
      errorMessage = err.response?.data?.message || '資料驗證失敗';
    } else if (err.response?.status === 500) {
      errorMessage = err.response?.data?.message || '伺服器內部錯誤';
    } else if (err.response?.status >= 500) {
      errorMessage = '伺服器錯誤，請稍後再試';
    }
    // API 回應中的錯誤訊息
    else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    }
    // JavaScript 錯誤
    else if (err.message) {
      errorMessage = err.message;
    }
    
    console.error('❌ [Redux] 最終錯誤訊息:', errorMessage);
    
    dispatch({
      type: ActionTypes.CREATE_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE,
      payload: errorMessage
    });
    throw new Error(errorMessage);
  }
};

// 更新內嵌分錄交易群組
export const updateTransactionGroupWithEntries = (
  id: string,
  transactionData: Partial<TransactionGroupWithEntries>
): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 updateTransactionGroupWithEntries 開始:', { id, transactionData });
    dispatch({ type: ActionTypes.UPDATE_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST });
    
    const config = getAuthConfig();
    const res = await axios.put<ApiResponse<TransactionGroupWithEntries>>(
      `${API_BASE_URL}/transaction-groups-with-entries/${id}`,
      transactionData,
      config
    );
    
    console.log('📡 更新內嵌分錄交易群組 API 回應:', res.data);
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.UPDATE_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ updateTransactionGroupWithEntries 成功:', res.data.data);
      return res.data.data;
    } else {
      throw new Error(res.data.message ?? '更新內嵌分錄交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ updateTransactionGroupWithEntries 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '更新內嵌分錄交易群組失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.status === 400) {
      errorMessage = err.response?.data?.message || '請求資料格式錯誤';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.UPDATE_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE,
      payload: errorMessage
    });
    throw new Error(errorMessage);
  }
};

// 刪除內嵌分錄交易群組
export const deleteTransactionGroupWithEntries = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 deleteTransactionGroupWithEntries 開始:', id);
    dispatch({ type: ActionTypes.DELETE_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST });
    
    const config = getAuthConfig();
    const res = await axios.delete<ApiResponse>(
      `${API_BASE_URL}/transaction-groups-with-entries/${id}`,
      config
    );
    
    console.log('📡 刪除內嵌分錄交易群組 API 回應:', res.data);
    
    if (res.data.success) {
      dispatch({
        type: ActionTypes.DELETE_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS,
        payload: id
      });
      console.log('✅ deleteTransactionGroupWithEntries 成功:', id);
      return id;
    } else {
      throw new Error(res.data.message ?? '刪除內嵌分錄交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ deleteTransactionGroupWithEntries 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '刪除內嵌分錄交易群組失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.DELETE_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE,
      payload: errorMessage
    });
    throw new Error(errorMessage);
  }
};

// 搜尋內嵌分錄交易群組
export const searchTransactionGroupsWithEntries = (searchParams: {
  query?: string;
  organizationId?: string;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  fundingType?: string;
  page?: number;
  limit?: number;
}): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 searchTransactionGroupsWithEntries 開始:', searchParams);
    dispatch({ type: ActionTypes.SEARCH_TRANSACTION_GROUPS_WITH_ENTRIES_REQUEST });
    
    const config = {
      ...getAuthConfig(),
      params: searchParams
    };
    
    const res = await axios.get<ApiResponse<{
      groups: TransactionGroupWithEntries[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>(`${API_BASE_URL}/transaction-groups-with-entries/search`, config);
    
    console.log('📡 搜尋內嵌分錄交易群組 API 回應:', res.data);
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.SEARCH_TRANSACTION_GROUPS_WITH_ENTRIES_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ searchTransactionGroupsWithEntries 成功，搜尋結果筆數:', res.data.data.groups.length);
    } else {
      throw new Error(res.data.message ?? '搜尋內嵌分錄交易群組失敗');
    }
  } catch (err: any) {
    console.error('❌ searchTransactionGroupsWithEntries 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '搜尋內嵌分錄交易群組失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.SEARCH_TRANSACTION_GROUPS_WITH_ENTRIES_FAILURE,
      payload: errorMessage
    });
  }
};

// 獲取資金追蹤鏈
export const fetchFundingChain = (transactionId: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 fetchFundingChain 開始:', transactionId);
    dispatch({ type: ActionTypes.FETCH_FUNDING_CHAIN_REQUEST });
    
    const config = getAuthConfig();
    const res = await axios.get<ApiResponse<{
      sourceChain: TransactionGroupWithEntries[];
      linkedChain: TransactionGroupWithEntries[];
    }>>(`${API_BASE_URL}/transaction-groups-with-entries/${transactionId}/funding-chain`, config);
    
    console.log('📡 資金追蹤鏈 API 回應:', res.data);
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.FETCH_FUNDING_CHAIN_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ fetchFundingChain 成功');
    } else {
      throw new Error(res.data.message ?? '獲取資金追蹤鏈失敗');
    }
  } catch (err: any) {
    console.error('❌ fetchFundingChain 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '獲取資金追蹤鏈失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.FETCH_FUNDING_CHAIN_FAILURE,
      payload: errorMessage
    });
  }
};

// 驗證借貸平衡
export const validateBalance = (
  entries: EmbeddedAccountingEntry[]
): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 validateBalance 開始:', entries);
    dispatch({ type: ActionTypes.VALIDATE_BALANCE_REQUEST });
    
    const config = getAuthConfig();
    const res = await axios.post<ApiResponse<{
      isBalanced: boolean;
      totalDebit: number;
      totalCredit: number;
      difference: number;
      errors: string[];
    }>>(`${API_BASE_URL}/transaction-groups-with-entries/validate-balance`,
    { entries },
    config);
    
    console.log('📡 借貸平衡驗證 API 回應:', res.data);
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.VALIDATE_BALANCE_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ validateBalance 成功:', res.data.data);
      return res.data.data;
    } else {
      throw new Error(res.data.message ?? '借貸平衡驗證失敗');
    }
  } catch (err: any) {
    console.error('❌ validateBalance 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '借貸平衡驗證失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.VALIDATE_BALANCE_FAILURE,
      payload: errorMessage
    });
    throw new Error(errorMessage);
  }
};

// 確認交易
export const confirmTransactionGroupWithEntries = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 confirmTransactionGroupWithEntries 開始:', id);
    dispatch({ type: ActionTypes.CONFIRM_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST });
    
    const config = getAuthConfig();
    const res = await axios.post<ApiResponse<TransactionGroupWithEntries>>(
      `${API_BASE_URL}/transaction-groups-with-entries/${id}/confirm`,
      {},
      config
    );
    
    console.log('📡 確認交易 API 回應:', res.data);
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.CONFIRM_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ confirmTransactionGroupWithEntries 成功:', res.data.data);
      return res.data.data;
    } else {
      throw new Error(res.data.message ?? '確認交易失敗');
    }
  } catch (err: any) {
    console.error('❌ confirmTransactionGroupWithEntries 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '確認交易失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.status === 400) {
      errorMessage = err.response?.data?.message || '交易狀態不允許確認';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.CONFIRM_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE,
      payload: errorMessage
    });
    throw new Error(errorMessage);
  }
};

// 解鎖交易
export const unlockTransactionGroupWithEntries = (id: string): AppThunk => async (
  dispatch: ThunkDispatch<RootState, unknown, Action>
) => {
  try {
    console.log('🔍 unlockTransactionGroupWithEntries 開始:', id);
    dispatch({ type: ActionTypes.UNLOCK_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST });
    
    const config = getAuthConfig();
    const res = await axios.post<ApiResponse<TransactionGroupWithEntries>>(
      `${API_BASE_URL}/transaction-groups-with-entries/${id}/unlock`,
      {},
      config
    );
    
    console.log('📡 解鎖交易 API 回應:', res.data);
    
    if (res.data.success && res.data.data) {
      dispatch({
        type: ActionTypes.UNLOCK_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS,
        payload: res.data.data
      });
      console.log('✅ unlockTransactionGroupWithEntries 成功:', res.data.data);
      return res.data.data;
    } else {
      throw new Error(res.data.message ?? '解鎖交易失敗');
    }
  } catch (err: any) {
    console.error('❌ unlockTransactionGroupWithEntries 失敗:', err);
    console.error('❌ 錯誤詳情:', err.response?.data);
    
    let errorMessage = '解鎖交易失敗';
    if (err.response?.status === 401) {
      errorMessage = '認證失敗，請重新登入';
    } else if (err.response?.status === 400) {
      errorMessage = err.response?.data?.message || '交易狀態不允許解鎖或有依賴交易';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    dispatch({
      type: ActionTypes.UNLOCK_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE,
      payload: errorMessage
    });
    throw new Error(errorMessage);
  }
};

// 清除當前交易群組
export const clearCurrentTransactionGroupWithEntries = (): Action => ({
  type: ActionTypes.CLEAR_CURRENT_TRANSACTION_GROUP_WITH_ENTRIES
});

// 清除錯誤狀態
export const clearTransactionGroupsWithEntriesError = (): Action => ({
  type: ActionTypes.CLEAR_TRANSACTION_GROUPS_WITH_ENTRIES_ERROR
});