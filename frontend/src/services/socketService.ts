import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private tabId: string;
  private isMainTab: boolean = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 為每個分頁生成唯一 ID
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initTabCoordination();
  }

  // 初始化分頁協調機制
  private initTabCoordination(): void {
    // 檢查是否為主分頁
    this.checkMainTab();
    
    // 監聽其他分頁的狀態
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // 定期檢查主分頁狀態
    this.connectionCheckInterval = setInterval(() => {
      this.checkMainTab();
    }, 5000);
  }

  // 檢查是否為主分頁
  private checkMainTab(): void {
    const mainTabId = localStorage.getItem('socket_main_tab');
    const mainTabTimestamp = localStorage.getItem('socket_main_tab_timestamp');
    const now = Date.now();
    
    // 如果沒有主分頁或主分頁超時（10秒），則成為主分頁
    if (!mainTabId || !mainTabTimestamp || (now - parseInt(mainTabTimestamp)) > 10000) {
      this.becomeMainTab();
    } else if (mainTabId === this.tabId) {
      this.isMainTab = true;
      // 更新時間戳
      localStorage.setItem('socket_main_tab_timestamp', now.toString());
    } else {
      this.isMainTab = false;
    }
  }

  // 成為主分頁
  private becomeMainTab(): void {
    this.isMainTab = true;
    localStorage.setItem('socket_main_tab', this.tabId);
    localStorage.setItem('socket_main_tab_timestamp', Date.now().toString());
    console.log(`🎯 分頁 ${this.tabId} 成為主 WebSocket 連線`);
  }

  // 處理 Storage 變化
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'socket_main_tab' && event.newValue !== this.tabId) {
      this.isMainTab = false;
      if (this.socket && this.isConnected) {
        console.log(`🔄 分頁 ${this.tabId} 讓出 WebSocket 連線`);
        this.disconnect();
      }
    }
  }

  // 頁面卸載前處理
  private handleBeforeUnload(): void {
    if (this.isMainTab) {
      localStorage.removeItem('socket_main_tab');
      localStorage.removeItem('socket_main_tab_timestamp');
    }
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  // 初始化 Socket 連接
  connect(): void {
    // 只有主分頁才能建立 WebSocket 連線
    if (!this.isMainTab) {
      console.log(`⏸️ 分頁 ${this.tabId} 非主分頁，跳過 WebSocket 連線`);
      return;
    }

    if (this.socket && this.isConnected) {
      return; // 已經連接，不需要重複連接
    }

    // 智能檢測後端 URL
    // 如果是 localhost，使用 localhost:5000
    // 如果是其他 IP，使用該 IP:5000
    let serverUrl: string;
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      serverUrl = 'http://localhost:5000';
    } else {
      serverUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    
    // 允許環境變數覆蓋
    if (process.env.REACT_APP_API_URL) {
      serverUrl = process.env.REACT_APP_API_URL;
    }
    
    console.log('WebSocket 嘗試連接到:', serverUrl);
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket 已連接:', this.socket?.id);
      console.log('連接到伺服器:', serverUrl);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket 已斷線:', reason);
      this.isConnected = false;
      
      // 自動重連邏輯
      if (reason === 'io server disconnect') {
        // 伺服器主動斷線，需要手動重連
        console.log('🔄 嘗試重新連接...');
        setTimeout(() => {
          this.socket?.connect();
        }, 5000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket 連接錯誤:', error);
      console.error('嘗試連接的 URL:', serverUrl);
      this.isConnected = false;
    });
  }

  // 斷開連接
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 加入 sales-new2 房間
  joinSalesNew2Room(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-sales-new2');
      console.log('🏠 已加入 sales-new2 房間');
    } else {
      console.warn('⚠️ 無法加入房間：WebSocket 未連接');
      // 延遲重試
      setTimeout(() => {
        if (this.socket && this.isConnected) {
          this.joinSalesNew2Room();
        }
      }, 2000);
    }
  }

  // 離開 sales-new2 房間
  leaveSalesNew2Room(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-sales-new2');
      console.log('🚪 已離開 sales-new2 房間');
    }
  }

  // 監聽銷售記錄建立事件
  onSaleCreated(callback: (data: any) => void): void {
    if (this.socket) {
      // 先移除舊的監聽器，避免重複註冊
      this.socket.off('sale-created');
      this.socket.off('sale-created-broadcast');
      
      // 監聽房間事件
      this.socket.on('sale-created', (data) => {
        console.log('📥 收到房間 sale-created 事件:', data);
        callback(data);
      });
      
      // 監聽廣播事件（備用）
      this.socket.on('sale-created-broadcast', (data) => {
        console.log('📥 收到廣播 sale-created 事件:', data);
        callback(data);
      });
      
      console.log('🎧 已註冊 sale-created 事件監聽器（房間 + 廣播）');
    } else {
      console.warn('⚠️ 無法註冊 sale-created 監聽器：Socket 未連接');
    }
  }

  // 監聽銷售記錄更新事件
  onSaleUpdated(callback: (data: any) => void): void {
    if (this.socket) {
      // 先移除舊的監聽器，避免重複註冊
      this.socket.off('sale-updated');
      this.socket.off('sale-updated-broadcast');
      
      // 監聽房間事件
      this.socket.on('sale-updated', (data) => {
        console.log('📥 收到房間 sale-updated 事件:', data);
        callback(data);
      });
      
      // 監聽廣播事件（備用）
      this.socket.on('sale-updated-broadcast', (data) => {
        console.log('📥 收到廣播 sale-updated 事件:', data);
        callback(data);
      });
      
      console.log('🎧 已註冊 sale-updated 事件監聽器（房間 + 廣播）');
    } else {
      console.warn('⚠️ 無法註冊 sale-updated 監聽器：Socket 未連接');
    }
  }

  // 移除事件監聽器
  offSaleCreated(): void {
    if (this.socket) {
      this.socket.off('sale-created');
      this.socket.off('sale-created-broadcast');
      console.log('🔇 已移除 sale-created 事件監聽器（房間 + 廣播）');
    }
  }

  offSaleUpdated(): void {
    if (this.socket) {
      this.socket.off('sale-updated');
      this.socket.off('sale-updated-broadcast');
      console.log('🔇 已移除 sale-updated 事件監聽器（房間 + 廣播）');
    }
  }

  // 檢查連接狀態
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // 獲取 Socket 實例（用於調試）
  getSocket(): Socket | null {
    return this.socket;
  }
}

// 創建單例實例
const socketService = new SocketService();

export default socketService;