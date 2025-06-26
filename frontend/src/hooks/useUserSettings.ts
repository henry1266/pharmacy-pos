import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authServiceV2';

// 定義快捷按鈕類型
export interface UserShortcut {
  id: string;
  name: string;
  productIds: string[];
}

// 定義用戶設定類型
export interface UserSettings {
  shortcuts?: UserShortcut[];
}

/**
 * 用戶設定管理 Hook
 */
export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 從當前用戶資料中載入設定
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = await authService.getCurrentUser();
      const userSettings = (currentUser as any).settings || {};
      
      // 確保 shortcuts 是陣列格式
      const shortcuts = Array.isArray(userSettings.shortcuts)
        ? userSettings.shortcuts
        : [];
      
      setSettings({
        shortcuts,
        ...userSettings
      });
    } catch (err: any) {
      console.error('載入用戶設定失敗:', err);
      setError('載入用戶設定失敗');
      
      // 如果載入失敗，使用預設設定
      setSettings({
        shortcuts: [{
          id: 'default',
          name: '常用藥品',
          productIds: []
        }]
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新設定到後端
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    const originalSettings = settings; // 保存原始狀態用於回滾
    
    try {
      setError(null);
      
      const updatedSettings = { ...settings, ...newSettings };
      
      // 樂觀更新：立即更新本地狀態
      setSettings(updatedSettings);
      
      // 呼叫後端 API
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到認證令牌');
      }
      
      const response = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ settings: updatedSettings })
      });
      
      if (!response.ok) {
        // 如果失敗，回滾到原始狀態
        setSettings(originalSettings);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedUser = await response.json();
      
      // 更新 localStorage 中的用戶資料
      const currentStoredUser = authService.getStoredUser();
      if (currentStoredUser) {
        const updatedStoredUser = { ...currentStoredUser, settings: updatedUser.settings };
        localStorage.setItem('user', JSON.stringify(updatedStoredUser));
      }
      
      // 不需要再次更新狀態，因為樂觀更新已經生效
      return true;
    } catch (err: any) {
      console.error('更新用戶設定失敗:', err);
      setError('更新用戶設定失敗');
      // 如果發生錯誤，確保回滾到原始狀態
      setSettings(originalSettings);
      return false;
    }
  }, [settings]);

  // 更新快捷按鈕
  const updateShortcuts = useCallback(async (shortcuts: UserShortcut[]): Promise<boolean> => {
    return updateSettings({ shortcuts });
  }, [updateSettings]);

  // 添加快捷按鈕
  const addShortcut = useCallback(async (shortcut: UserShortcut): Promise<boolean> => {
    const currentShortcuts = settings.shortcuts || [];
    const newShortcuts = [...currentShortcuts, shortcut];
    return updateShortcuts(newShortcuts);
  }, [settings.shortcuts, updateShortcuts]);

  // 移除快捷按鈕
  const removeShortcut = useCallback(async (shortcutId: string): Promise<boolean> => {
    const currentShortcuts = settings.shortcuts || [];
    const newShortcuts = currentShortcuts.filter(s => s.id !== shortcutId);
    return updateShortcuts(newShortcuts);
  }, [settings.shortcuts, updateShortcuts]);

  // 更新快捷按鈕項目
  const updateShortcutItems = useCallback(async (shortcutId: string, productIds: string[]): Promise<boolean> => {
    const currentShortcuts = settings.shortcuts || [];
    const newShortcuts = currentShortcuts.map(s =>
      s.id === shortcutId ? { ...s, productIds } : s
    );
    return updateShortcuts(newShortcuts);
  }, [settings.shortcuts, updateShortcuts]);

  // 更新快捷按鈕名稱
  const updateShortcutName = useCallback(async (shortcutId: string, name: string): Promise<boolean> => {
    const currentShortcuts = settings.shortcuts || [];
    const newShortcuts = currentShortcuts.map(s =>
      s.id === shortcutId ? { ...s, name } : s
    );
    return updateShortcuts(newShortcuts);
  }, [settings.shortcuts, updateShortcuts]);

  // 初始載入
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 調試資訊
  React.useEffect(() => {
    console.log('useUserSettings - settings:', settings);
    console.log('useUserSettings - shortcuts:', settings.shortcuts || []);
    console.log('useUserSettings - loading:', loading);
    console.log('useUserSettings - error:', error);
  }, [settings, loading, error]);

  return {
    settings,
    shortcuts: settings.shortcuts || [],
    loading,
    error,
    loadSettings,
    updateSettings,
    updateShortcuts,
    addShortcut,
    removeShortcut,
    updateShortcutItems,
    updateShortcutName
  };
};

export default useUserSettings;