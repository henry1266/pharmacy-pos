import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  // 初始化 Socket 連接
  connect(): void {
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