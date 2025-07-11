/**
 * WebSocket 服務 - 已停用
 * 此服務已被停用，所有方法都是空操作
 * 保持介面完整性以避免破壞依賴程式碼
 */

// 導入類型定義但不實際使用
// import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: any = null;
  private isConnected: boolean = false;
  private tabId: string;
  private isMainTab: boolean = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 生成唯一 ID（保持介面一致性）
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🚫 SocketService 已停用 - 所有 WebSocket 功能已禁用');
  }

  // 空操作 - 初始化 Socket 連接
  connect(): void {
    console.log('🚫 SocketService 已停用 - connect() 方法無效');
  }

  // 空操作 - 斷開連接
  disconnect(): void {
    console.log('🚫 SocketService 已停用 - disconnect() 方法無效');
  }

  // 空操作 - 加入 sales-new2 房間
  joinSalesNew2Room(): void {
    console.log('🚫 SocketService 已停用 - joinSalesNew2Room() 方法無效');
  }

  // 空操作 - 離開 sales-new2 房間
  leaveSalesNew2Room(): void {
    console.log('🚫 SocketService 已停用 - leaveSalesNew2Room() 方法無效');
  }

  // 空操作 - 監聽銷售記錄建立事件
  onSaleCreated(callback: (data: any) => void): void {
    console.log('🚫 SocketService 已停用 - onSaleCreated() 方法無效');
  }

  // 空操作 - 監聽銷售記錄更新事件
  onSaleUpdated(callback: (data: any) => void): void {
    console.log('🚫 SocketService 已停用 - onSaleUpdated() 方法無效');
  }

  // 空操作 - 移除事件監聽器
  offSaleCreated(): void {
    console.log('🚫 SocketService 已停用 - offSaleCreated() 方法無效');
  }

  offSaleUpdated(): void {
    console.log('🚫 SocketService 已停用 - offSaleUpdated() 方法無效');
  }

  // 返回 false - 檢查連接狀態
  isSocketConnected(): boolean {
    return false;
  }

  // 返回 null - 獲取 Socket 實例
  getSocket(): any {
    return null;
  }
}

// 創建單例實例
const socketService = new SocketService();

export default socketService;