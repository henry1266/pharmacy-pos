/**
 * 交易狀態管理工具 - 純函數，前後端共用
 */

export type TransactionStatusType = 'draft' | 'confirmed' | 'cancelled';

export interface TransactionPermissions {
  status: TransactionStatusType;
  canEdit: boolean;
  canDelete: boolean;
  canConfirm: boolean;
}

export interface StatusDisplayInfo {
  label: string;
  color: 'success' | 'warning' | 'error' | 'default' | 'primary' | 'secondary' | 'info';
  bgColor: string;
}

export class TransactionStatusManager {
  /**
   * 驗證交易狀態並返回操作權限
   */
  static getPermissions(status?: string): TransactionPermissions {
    const currentStatus = (status || 'draft') as TransactionStatusType;
    
    switch (currentStatus) {
      case 'confirmed':
        return {
          status: 'confirmed',
          canEdit: false,
          canDelete: false,
          canConfirm: false
        };
      case 'cancelled':
        return {
          status: 'cancelled',
          canEdit: false,
          canDelete: false,
          canConfirm: false
        };
      default:
        return {
          status: 'draft',
          canEdit: true,
          canDelete: true,
          canConfirm: true
        };
    }
  }

  /**
   * 格式化狀態顯示資訊
   */
  static getDisplayInfo(status: string): StatusDisplayInfo {
    switch (status) {
      case 'confirmed':
        return {
          label: '已確認',
          color: 'success',
          bgColor: '#e8f5e8'
        };
      case 'cancelled':
        return {
          label: '已取消',
          color: 'error',
          bgColor: '#ffeaea'
        };
      default:
        return {
          label: '草稿',
          color: 'warning',
          bgColor: '#fff8e1'
        };
    }
  }

  /**
   * 檢查狀態轉換是否有效
   */
  static isValidStatusTransition(fromStatus: TransactionStatusType, toStatus: TransactionStatusType): boolean {
    // 定義有效的狀態轉換
    const validTransitions: Record<TransactionStatusType, TransactionStatusType[]> = {
      draft: ['confirmed', 'cancelled'],
      confirmed: [], // 已確認的交易不能轉換到其他狀態
      cancelled: [] // 已取消的交易不能轉換到其他狀態
    };

    return validTransitions[fromStatus].includes(toStatus);
  }

  /**
   * 取得可用的狀態轉換選項
   */
  static getAvailableTransitions(currentStatus: TransactionStatusType): TransactionStatusType[] {
    const validTransitions: Record<TransactionStatusType, TransactionStatusType[]> = {
      draft: ['confirmed', 'cancelled'],
      confirmed: [],
      cancelled: []
    };

    return validTransitions[currentStatus] || [];
  }

  /**
   * 檢查是否為最終狀態（不可再變更）
   */
  static isFinalStatus(status: TransactionStatusType): boolean {
    return status === 'confirmed' || status === 'cancelled';
  }

  /**
   * 檢查是否為可編輯狀態
   */
  static isEditable(status: TransactionStatusType): boolean {
    return status === 'draft';
  }

  /**
   * 取得狀態的優先級（用於排序）
   */
  static getStatusPriority(status: TransactionStatusType): number {
    const priorities: Record<TransactionStatusType, number> = {
      draft: 1,
      confirmed: 2,
      cancelled: 3
    };

    return priorities[status] || 0;
  }

  /**
   * 格式化狀態變更訊息
   */
  static getStatusChangeMessage(fromStatus: TransactionStatusType, toStatus: TransactionStatusType): string {
    const messages: Record<string, string> = {
      'draft-confirmed': '交易已確認，無法再修改',
      'draft-cancelled': '交易已取消',
      'confirmed-cancelled': '已確認的交易無法取消',
      'cancelled-confirmed': '已取消的交易無法確認'
    };

    const key = `${fromStatus}-${toStatus}`;
    return messages[key] || `狀態已從 ${fromStatus} 變更為 ${toStatus}`;
  }

  /**
   * 驗證狀態值是否有效
   */
  static isValidStatus(status: string): status is TransactionStatusType {
    return ['draft', 'confirmed', 'cancelled'].includes(status);
  }

  /**
   * 取得預設狀態
   */
  static getDefaultStatus(): TransactionStatusType {
    return 'draft';
  }
}