/**
 * 路由工具函數
 */

/**
 * 構建路由路徑
 */
export const buildRoute = (basePath: string, ...segments: (string | number)[]): string => {
  const cleanBase = basePath.replace(/\/$/, '');
  const cleanSegments = segments
    .filter(segment => segment !== null && segment !== undefined)
    .map(segment => String(segment).replace(/^\/|\/$/g, ''));
  
  return [cleanBase, ...cleanSegments].join('/');
};

/**
 * 會計模組路由
 */
export const accountingRoutes = {
  // 主頁面
  dashboard: '/accounting2',
  
  // 帳戶管理
  accounts: '/accounting2/accounts',
  accountDetail: (id: string) => `/accounting2/accounts/${id}`,
  accountEdit: (id: string) => `/accounting2/accounts/${id}/edit`,
  accountNew: '/accounting2/accounts/new',
  
  // 交易管理
  transactions: '/accounting2/transactions',
  transactionDetail: (id: string) => `/accounting2/transactions/${id}`,
  transactionEdit: (id: string) => `/accounting2/transactions/${id}/edit`,
  transactionNew: '/accounting2/transactions/new',
  
  // 分類管理
  categories: '/accounting2/categories',
  categoryDetail: (id: string) => `/accounting2/categories/${id}`,
  categoryEdit: (id: string) => `/accounting2/categories/${id}/edit`,
  categoryNew: '/accounting2/categories/new',
  
  // 報表
  reports: '/accounting2/reports',
  balanceSheet: '/accounting2/reports/balance-sheet',
  incomeStatement: '/accounting2/reports/income-statement',
  cashFlow: '/accounting2/reports/cash-flow',
};

/**
 * 檢查當前路由是否匹配
 */
export const isRouteActive = (currentPath: string, targetPath: string, exact = false): boolean => {
  if (exact) {
    return currentPath === targetPath;
  }
  return currentPath.startsWith(targetPath);
};

/**
 * 從路由中提取參數
 */
export const extractRouteParams = (pattern: string, path: string): Record<string, string> => {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  const params: Record<string, string> = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    
    if (patternPart?.startsWith(':') && pathPart) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    }
  }
  
  return params;
};

/**
 * 構建查詢字串
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * 解析查詢字串
 */
export const parseQueryString = (search: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(search);
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

/**
 * 導航到指定路由
 */
export const navigateTo = (path: string, replace = false): void => {
  if (typeof window !== 'undefined' && window.history) {
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    
    // 觸發 popstate 事件以通知路由變更
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

/**
 * 返回上一頁
 */
export const goBack = (): void => {
  if (typeof window !== 'undefined' && window.history) {
    window.history.back();
  }
};

/**
 * RouteUtils 物件 - 向後相容
 */
export const RouteUtils = {
  createAccountDetailRoute: (accountId: string) => accountingRoutes.accountDetail(accountId),
  createEditTransactionRoute: (transactionId: string, params?: { returnTo?: string }) => {
    const route = accountingRoutes.transactionEdit(transactionId);
    return params?.returnTo ? `${route}${buildQueryString({ returnTo: params.returnTo })}` : route;
  },
  createCopyTransactionRoute: (transactionId: string, params?: { returnTo?: string }) => {
    const route = `${accountingRoutes.transactionNew}?copyFrom=${transactionId}`;
    return params?.returnTo ? `${route}&returnTo=${encodeURIComponent(params.returnTo)}` : route;
  },
  createNewTransactionRoute: (params?: {
    returnTo?: string;
    accountId?: string;
    defaultAccountId?: string;
    defaultOrganizationId?: string;
  }) => {
    const route = accountingRoutes.transactionNew;
    const queryParams: Record<string, any> = {};
    if (params?.returnTo) queryParams.returnTo = params.returnTo;
    if (params?.accountId) queryParams.accountId = params.accountId;
    if (params?.defaultAccountId) queryParams.defaultAccountId = params.defaultAccountId;
    if (params?.defaultOrganizationId) queryParams.defaultOrganizationId = params.defaultOrganizationId;
    return `${route}${buildQueryString(queryParams)}`;
  },
};