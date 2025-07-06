/**
 * 路由工具函數
 * 統一處理 accounting2 相關的路由跳轉
 */

export interface NavigationParams {
  returnTo?: string;
  defaultAccountId?: string;
  defaultOrganizationId?: string;
}

export class RouteUtils {
  /**
   * 建立編輯交易的路由
   */
  static createEditTransactionRoute(transactionId: string, params?: NavigationParams): string {
    const baseRoute = `/accounting2/transaction/${transactionId}/edit`;
    return this.appendParams(baseRoute, params);
  }

  /**
   * 建立複製交易的路由
   */
  static createCopyTransactionRoute(transactionId: string, params?: NavigationParams): string {
    const baseRoute = `/accounting2/transaction/${transactionId}/copy`;
    return this.appendParams(baseRoute, params);
  }

  /**
   * 建立新增交易的路由
   */
  static createNewTransactionRoute(params?: NavigationParams): string {
    const baseRoute = '/accounting2';
    return this.appendParams(baseRoute, params);
  }

  /**
   * 建立科目詳情頁路由
   */
  static createAccountDetailRoute(accountId: string): string {
    return `/accounting2/account/${accountId}`;
  }

  /**
   * 附加 URL 參數
   */
  private static appendParams(baseRoute: string, params?: NavigationParams): string {
    if (!params) return baseRoute;

    const urlParams = new URLSearchParams();
    
    if (params.returnTo) {
      urlParams.set('returnTo', params.returnTo);
    }
    if (params.defaultAccountId) {
      urlParams.set('defaultAccountId', params.defaultAccountId);
    }
    if (params.defaultOrganizationId) {
      urlParams.set('defaultOrganizationId', params.defaultOrganizationId);
    }

    const paramString = urlParams.toString();
    return paramString ? `${baseRoute}?${paramString}` : baseRoute;
  }

  /**
   * 解析 URL 參數
   */
  static parseNavigationParams(searchParams: URLSearchParams): NavigationParams {
    return {
      returnTo: searchParams.get('returnTo') || undefined,
      defaultAccountId: searchParams.get('defaultAccountId') || undefined,
      defaultOrganizationId: searchParams.get('defaultOrganizationId') || undefined,
    };
  }

  /**
   * 檢查是否為複製模式
   */
  static isCopyMode(pathname: string): boolean {
    return pathname.includes('/copy');
  }

  /**
   * 檢查是否為編輯模式
   */
  static isEditMode(pathname: string): boolean {
    return pathname.includes('/edit');
  }

  /**
   * 從路徑中提取交易ID
   */
  static extractTransactionId(pathname: string): string | null {
    const match = pathname.match(/\/transaction\/([^\/]+)/);
    return match && match[1] ? match[1] : null;
  }
}