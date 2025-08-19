import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 認証状態の型定義
export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  loginTime: Date | null;
}

// 認証コンテキストの型定義
interface AuthContextType {
  authState: AuthState;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuthStatus: () => void;
}

// デフォルト認証状態
const defaultAuthState: AuthState = {
  isAuthenticated: false,
  isAdmin: false,
  token: null,
  loginTime: null
};

// 認証コンテキスト作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ローカルストレージキー
const AUTH_STORAGE_KEY = 'site-scan-auth';
const TOKEN_STORAGE_KEY = 'site-scan-token';

// 認証プロバイダー
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  // コンポーネントマウント時に認証状態を復元
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * 管理者ログイン
   */
  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://site-scan-production.up.railway.app';
      
      console.log('🔐 管理者ログイン試行...');

      const response = await fetch(`${API_BASE_URL}/api/auth/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'ログインに失敗しました'
        };
      }

      const newAuthState: AuthState = {
        isAuthenticated: true,
        isAdmin: true,
        token: data.data.token,
        loginTime: new Date()
      };

      // 状態更新
      setAuthState(newAuthState);

      // ローカルストレージに保存
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        isAuthenticated: true,
        isAdmin: true,
        loginTime: newAuthState.loginTime?.toISOString()
      }));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.data.token);

      console.log('✅ 管理者ログイン成功');

      return { success: true };

    } catch (error) {
      console.error('ログインエラー:', error);
      return {
        success: false,
        error: 'ネットワークエラーが発生しました'
      };
    }
  };

  /**
   * ログアウト
   */
  const logout = (): void => {
    setAuthState(defaultAuthState);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    console.log('👋 ログアウトしました');
  };

  /**
   * 認証状態をチェック
   */
  const checkAuthStatus = (): void => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!savedAuth || !savedToken) {
        setAuthState(defaultAuthState);
        return;
      }

      const authData = JSON.parse(savedAuth);
      const loginTime = authData.loginTime ? new Date(authData.loginTime) : null;

      // トークンの有効期限チェック（24時間）
      if (loginTime) {
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLogin > 24) {
          // トークン期限切れ
          logout();
          return;
        }
      }

      // 認証状態復元
      setAuthState({
        isAuthenticated: authData.isAuthenticated || false,
        isAdmin: authData.isAdmin || false,
        token: savedToken,
        loginTime: loginTime
      });

      console.log('🔄 認証状態を復元しました');

    } catch (error) {
      console.error('認証状態チェックエラー:', error);
      setAuthState(defaultAuthState);
    }
  };

  /**
   * APIリクエスト用の認証ヘッダーを取得
   */
  const getAuthHeaders = (): { [key: string]: string } => {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (authState.token && authState.isAdmin) {
      headers['Authorization'] = `Bearer ${authState.token}`;
    }

    return headers;
  };

  const value: AuthContextType = {
    authState,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 認証コンテキストを使用するためのカスタムフック
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * 管理者権限チェック用のフック
 */
export const useAdminAuth = (): {
  isAdmin: boolean;
  token: string | null;
  getAuthHeaders: () => { [key: string]: string };
} => {
  const { authState } = useAuth();
  
  const getAuthHeaders = (): { [key: string]: string } => {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (authState.token && authState.isAdmin) {
      headers['Authorization'] = `Bearer ${authState.token}`;
    }

    return headers;
  };

  return {
    isAdmin: authState.isAdmin,
    token: authState.token,
    getAuthHeaders
  };
};

export default AuthContext;