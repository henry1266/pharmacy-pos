import { transactionGroupWithEntriesService } from '../../../../services/transactionGroupWithEntriesService';

// 資金來源相關介面定義
interface FundingSource {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date | string;
  totalAmount: number;
  usedAmount: number;
  availableAmount: number;
  fundingType: 'original' | 'extended' | 'transfer';
  receiptUrl?: string;
  invoiceNo?: string;
  isAvailable: boolean;
}

interface FundingValidationResult {
  sourceId: string;
  isValid: boolean;
  sourceTransaction?: {
    _id: string;
    groupNumber: string;
    description: string;
    totalAmount: number;
    usedAmount: number;
    availableAmount: number;
  };
  error?: string;
}

interface FundingValidationData {
  validationResults: FundingValidationResult[];
  totalAvailableAmount: number;
  requiredAmount: number;
  isSufficient: boolean;
  summary: {
    validSources: number;
    invalidSources: number;
    totalSources: number;
  };
}

interface FundingFlowPathItem {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date | string;
  totalAmount: number;
  fundingType: 'original' | 'extended' | 'transfer';
}

interface FundingFlowData {
  sourceTransaction: any;
  linkedTransactions: any[];
  fundingPath: FundingFlowPathItem[];
  totalUsedAmount: number;
  availableAmount: number;
  originalSource?: any;
}

/**
 * FundingService - 資金來源追蹤業務邏輯服務
 * 
 * 負責處理資金來源追蹤相關的前端業務邏輯，包括：
 * - 資金來源驗證
 * - 資金流向追蹤
 * - 資金可用性檢查
 * - 資金鏈分析
 * - 資金使用統計
 */
export class FundingService {
  /**
   * 獲取可用的資金來源
   * @param requiredAmount 所需金額
   * @returns 可用資金來源列表
   */
  static async getAvailableFundingSources(requiredAmount?: number): Promise<{
    success: boolean;
    data: FundingSource[];
    total: number;
    error?: string;
  }> {
    try {
      // 獲取所有已確認的交易作為潛在資金來源
      const response = await transactionGroupWithEntriesService.getAll({
        status: 'confirmed'
      });
      
      const fundingSources: FundingSource[] = response.data.groups
        .filter(transaction => transaction.fundingType === 'original')
        .map(transaction => {
          // 計算已使用金額（這裡需要根據實際業務邏輯調整）
          const usedAmount = this.calculateUsedAmount(transaction);
          const availableAmount = transaction.totalAmount - usedAmount;
          
          return {
            _id: transaction._id,
            groupNumber: transaction.groupNumber,
            description: transaction.description,
            transactionDate: transaction.transactionDate,
            totalAmount: transaction.totalAmount,
            usedAmount,
            availableAmount,
            fundingType: transaction.fundingType,
            receiptUrl: transaction.receiptUrl,
            invoiceNo: transaction.invoiceNo,
            isAvailable: availableAmount > 0
          };
        })
        .filter(source => source.isAvailable);
      
      // 如果指定了所需金額，進一步過濾
      let filteredSources = fundingSources;
      if (requiredAmount !== undefined) {
        filteredSources = fundingSources.filter(source => 
          source.availableAmount >= requiredAmount
        );
      }
      
      // 按可用金額降序排列
      filteredSources.sort((a, b) => b.availableAmount - a.availableAmount);
      
      return {
        success: true,
        data: filteredSources,
        total: filteredSources.length
      };
    } catch (error) {
      console.error('獲取資金來源失敗:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : '獲取資金來源時發生未知錯誤'
      };
    }
  }
  
  /**
   * 驗證資金來源的可用性
   * @param sourceIds 資金來源ID陣列
   * @param requiredAmount 所需總金額
   * @returns 驗證結果
   */
  static async validateFundingSources(
    sourceIds: string[], 
    requiredAmount: number
  ): Promise<FundingValidationData> {
    const validationResults: FundingValidationResult[] = [];
    let totalAvailableAmount = 0;
    
    for (const sourceId of sourceIds) {
      try {
        const response = await transactionGroupWithEntriesService.getById(sourceId);
        const transaction = response.data;
        
        if (transaction.status !== 'confirmed') {
          validationResults.push({
            sourceId,
            isValid: false,
            error: '資金來源交易未確認'
          });
          continue;
        }
        
        if (transaction.fundingType !== 'original') {
          validationResults.push({
            sourceId,
            isValid: false,
            error: '只能使用原始資金作為資金來源'
          });
          continue;
        }
        
        const usedAmount = this.calculateUsedAmount(transaction);
        const availableAmount = transaction.totalAmount - usedAmount;
        
        if (availableAmount <= 0) {
          validationResults.push({
            sourceId,
            isValid: false,
            error: '資金來源已完全使用'
          });
          continue;
        }
        
        validationResults.push({
          sourceId,
          isValid: true,
          sourceTransaction: {
            _id: transaction._id,
            groupNumber: transaction.groupNumber,
            description: transaction.description,
            totalAmount: transaction.totalAmount,
            usedAmount,
            availableAmount
          }
        });
        
        totalAvailableAmount += availableAmount;
      } catch (error) {
        validationResults.push({
          sourceId,
          isValid: false,
          error: '無法獲取資金來源資訊'
        });
      }
    }
    
    const validSources = validationResults.filter(r => r.isValid).length;
    const invalidSources = validationResults.filter(r => !r.isValid).length;
    
    return {
      validationResults,
      totalAvailableAmount,
      requiredAmount,
      isSufficient: totalAvailableAmount >= requiredAmount,
      summary: {
        validSources,
        invalidSources,
        totalSources: sourceIds.length
      }
    };
  }
  
  /**
   * 追蹤資金流向
   * @param transactionId 交易ID
   * @returns 資金流向數據
   */
  static async traceFundingFlow(transactionId: string): Promise<{
    success: boolean;
    data?: FundingFlowData;
    error?: string;
  }> {
    try {
      const response = await transactionGroupWithEntriesService.getById(transactionId);
      const transaction = response.data;
      
      // 獲取關聯的交易
      const linkedTransactions = await this.getLinkedTransactions(transaction);
      
      // 建構資金流向路徑
      const fundingPath = await this.buildFundingPath(transaction);
      
      // 計算使用金額
      const totalUsedAmount = this.calculateTotalUsedAmount(linkedTransactions);
      const availableAmount = transaction.totalAmount - totalUsedAmount;
      
      // 找到原始資金來源
      const originalSource = await this.findOriginalSource(transaction);
      
      const fundingFlowData: FundingFlowData = {
        sourceTransaction: transaction,
        linkedTransactions,
        fundingPath,
        totalUsedAmount,
        availableAmount,
        originalSource
      };
      
      return {
        success: true,
        data: fundingFlowData
      };
    } catch (error) {
      console.error('追蹤資金流向失敗:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '追蹤資金流向時發生未知錯誤'
      };
    }
  }
  
  /**
   * 計算交易的已使用金額
   * @param transaction 交易數據
   * @returns 已使用金額
   */
  private static calculateUsedAmount(transaction: any): number {
    // 這裡需要根據實際的資金追蹤邏輯來計算
    // 暫時返回 0，實際實作時需要查詢所有引用此交易作為資金來源的交易
    if (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0) {
      // 這裡應該查詢所有被連結的交易並計算總金額
      // 暫時使用簡單的估算
      return transaction.totalAmount * 0.1; // 假設使用了 10%
    }
    return 0;
  }
  
  /**
   * 獲取關聯的交易
   * @param transaction 主交易
   * @returns 關聯交易陣列
   */
  private static async getLinkedTransactions(transaction: any): Promise<any[]> {
    if (!transaction.linkedTransactionIds || transaction.linkedTransactionIds.length === 0) {
      return [];
    }
    
    const linkedTransactions = [];
    for (const linkedId of transaction.linkedTransactionIds) {
      try {
        const response = await transactionGroupWithEntriesService.getById(linkedId);
        linkedTransactions.push(response.data);
      } catch (error) {
        console.warn(`無法獲取關聯交易 ${linkedId}:`, error);
      }
    }
    
    return linkedTransactions;
  }
  
  /**
   * 建構資金流向路徑
   * @param transaction 交易數據
   * @returns 資金流向路徑
   */
  private static async buildFundingPath(transaction: any): Promise<FundingFlowPathItem[]> {
    const path: FundingFlowPathItem[] = [];
    let currentTransaction = transaction;
    
    // 向上追蹤到原始資金來源
    while (currentTransaction.sourceTransactionId) {
      try {
        const response = await transactionGroupWithEntriesService.getById(
          currentTransaction.sourceTransactionId
        );
        const sourceTransaction = response.data;
        
        path.unshift({
          _id: sourceTransaction._id,
          groupNumber: sourceTransaction.groupNumber,
          description: sourceTransaction.description,
          transactionDate: sourceTransaction.transactionDate,
          totalAmount: sourceTransaction.totalAmount,
          fundingType: sourceTransaction.fundingType
        });
        
        currentTransaction = sourceTransaction;
      } catch (error) {
        console.warn('無法獲取資金來源交易:', error);
        break;
      }
    }
    
    // 加入當前交易
    path.push({
      _id: transaction._id,
      groupNumber: transaction.groupNumber,
      description: transaction.description,
      transactionDate: transaction.transactionDate,
      totalAmount: transaction.totalAmount,
      fundingType: transaction.fundingType
    });
    
    return path;
  }
  
  /**
   * 計算總使用金額
   * @param linkedTransactions 關聯交易陣列
   * @returns 總使用金額
   */
  private static calculateTotalUsedAmount(linkedTransactions: any[]): number {
    return linkedTransactions.reduce((total, transaction) => {
      return total + (transaction.totalAmount || 0);
    }, 0);
  }
  
  /**
   * 找到原始資金來源
   * @param transaction 交易數據
   * @returns 原始資金來源
   */
  private static async findOriginalSource(transaction: any): Promise<any | null> {
    let currentTransaction = transaction;
    
    // 如果當前交易就是原始資金，直接返回
    if (currentTransaction.fundingType === 'original') {
      return currentTransaction;
    }
    
    // 向上追蹤到原始資金來源
    while (currentTransaction.sourceTransactionId) {
      try {
        const response = await transactionGroupWithEntriesService.getById(
          currentTransaction.sourceTransactionId
        );
        currentTransaction = response.data;
        
        if (currentTransaction.fundingType === 'original') {
          return currentTransaction;
        }
      } catch (error) {
        console.warn('無法獲取原始資金來源:', error);
        break;
      }
    }
    
    return null;
  }
  
  /**
   * 格式化資金類型顯示
   * @param fundingType 資金類型
   * @returns 格式化的顯示文字
   */
  static formatFundingType(fundingType: string): {
    label: string;
    color: string;
    icon: string;
  } {
    const typeMap: Record<string, { label: string; color: string; icon: string }> = {
      'original': {
        label: '原始資金',
        color: '#4caf50',
        icon: '💰'
      },
      'extended': {
        label: '延伸使用',
        color: '#ff9800',
        icon: '🔄'
      },
      'transfer': {
        label: '資金轉移',
        color: '#2196f3',
        icon: '↔️'
      }
    };
    
    return typeMap[fundingType] || {
      label: fundingType,
      color: '#757575',
      icon: '❓'
    };
  }
  
  /**
   * 計算資金使用率
   * @param totalAmount 總金額
   * @param usedAmount 已使用金額
   * @returns 使用率百分比
   */
  static calculateUsagePercentage(totalAmount: number, usedAmount: number): number {
    if (totalAmount === 0) return 0;
    return Math.round((usedAmount / totalAmount) * 100);
  }
  
  /**
   * 檢查資金是否充足
   * @param availableAmount 可用金額
   * @param requiredAmount 所需金額
   * @returns 是否充足
   */
  static isFundingSufficient(availableAmount: number, requiredAmount: number): boolean {
    return availableAmount >= requiredAmount;
  }
  
  /**
   * 生成資金使用建議
   * @param fundingSources 資金來源陣列
   * @param requiredAmount 所需金額
   * @returns 使用建議
   */
  static generateFundingRecommendation(
    fundingSources: FundingSource[], 
    requiredAmount: number
  ): {
    recommendation: string;
    suggestedSources: FundingSource[];
    totalAvailable: number;
    isOptimal: boolean;
  } {
    const totalAvailable = fundingSources.reduce(
      (sum, source) => sum + source.availableAmount, 
      0
    );
    
    if (totalAvailable < requiredAmount) {
      return {
        recommendation: '可用資金不足，需要尋找其他資金來源',
        suggestedSources: [],
        totalAvailable,
        isOptimal: false
      };
    }
    
    // 優先使用金額較大的資金來源，減少資金碎片化
    const sortedSources = [...fundingSources].sort(
      (a, b) => b.availableAmount - a.availableAmount
    );
    
    const suggestedSources: FundingSource[] = [];
    let remainingAmount = requiredAmount;
    
    for (const source of sortedSources) {
      if (remainingAmount <= 0) break;
      
      if (source.availableAmount >= remainingAmount) {
        // 單一資金來源就足夠
        suggestedSources.push(source);
        remainingAmount = 0;
      } else {
        // 需要多個資金來源
        suggestedSources.push(source);
        remainingAmount -= source.availableAmount;
      }
    }
    
    const isOptimal = suggestedSources.length <= 2; // 最多使用兩個資金來源為最佳
    
    return {
      recommendation: isOptimal 
        ? '建議使用以下資金來源，資金配置最佳'
        : '建議使用以下資金來源，但可能造成資金碎片化',
      suggestedSources,
      totalAvailable,
      isOptimal
    };
  }
}

export default FundingService;