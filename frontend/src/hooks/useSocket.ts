import { useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';

interface UseSocketOptions {
  autoConnect?: boolean;
  joinSalesNew2Room?: boolean;
}

interface UseSocketReturn {
  connect: () => void;
  disconnect: () => void;
  joinSalesNew2Room: () => void;
  leaveSalesNew2Room: () => void;
  isConnected: () => boolean;
  onSaleCreated: (callback: (data: any) => void) => void;
  onSaleUpdated: (callback: (data: any) => void) => void;
}

export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { autoConnect = true, joinSalesNew2Room = false } = options;
  const isInitialized = useRef(false);

  // 連接 WebSocket
  const connect = useCallback(() => {
    socketService.connect();
  }, []);

  // 斷開 WebSocket
  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  // 加入 sales-new2 房間
  const joinRoom = useCallback(() => {
    socketService.joinSalesNew2Room();
  }, []);

  // 離開 sales-new2 房間
  const leaveRoom = useCallback(() => {
    socketService.leaveSalesNew2Room();
  }, []);

  // 檢查連接狀態
  const isConnected = useCallback(() => {
    return socketService.isSocketConnected();
  }, []);

  // 監聽銷售記錄建立事件
  const onSaleCreated = useCallback((callback: (data: any) => void) => {
    socketService.onSaleCreated(callback);
  }, []);

  // 監聽銷售記錄更新事件
  const onSaleUpdated = useCallback((callback: (data: any) => void) => {
    socketService.onSaleUpdated(callback);
  }, []);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;

      // 自動連接
      if (autoConnect) {
        console.log('🔄 useSocket: 開始自動連接');
        connect();
      }

      // 自動加入房間
      if (joinSalesNew2Room) {
        console.log('🏠 useSocket: 準備自動加入房間');
        // 延遲加入房間，確保連接已建立
        const timer = setTimeout(() => {
          console.log('🏠 useSocket: 嘗試加入房間');
          joinRoom();
        }, 2000); // 增加延遲時間

        return () => clearTimeout(timer);
      }
    }
  }, [autoConnect, joinSalesNew2Room, connect, joinRoom]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (joinSalesNew2Room) {
        leaveRoom();
      }
      // 注意：不在這裡斷開連接，因為其他組件可能還在使用
      // disconnect();
    };
  }, [joinSalesNew2Room, leaveRoom]);

  return {
    connect,
    disconnect,
    joinSalesNew2Room: joinRoom,
    leaveSalesNew2Room: leaveRoom,
    isConnected,
    onSaleCreated,
    onSaleUpdated,
  };
};

export default useSocket;