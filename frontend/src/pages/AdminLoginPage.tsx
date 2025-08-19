import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('パスワードを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login(password);
      
      if (result.success) {
        // ログイン成功 - 履歴ページにリダイレクト
        window.location.href = '/history';
      } else {
        setError(result.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('ログインエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl opacity-20"></div>
              <span className="relative z-10">S</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
              Site Scan V1
            </h1>
          </div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">管理者ログイン</h2>
          <p className="text-slate-400 text-sm">
            分析履歴の管理にはログインが必要です
          </p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* パスワード入力 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                管理者パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                  placeholder="パスワードを入力してください"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  <span>ログイン中...</span>
                </div>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          {/* 補足情報 */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">💡 一般ユーザーの方へ</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ログインは管理者用です。一般ユーザーは
                <Link to="/history" className="text-cyan-400 hover:text-cyan-300 transition-colors ml-1">
                  履歴ページ
                </Link>
                で自分の分析結果を確認できます。
              </p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center text-slate-400 hover:text-slate-300 transition-colors text-sm"
          >
            ← ホームに戻る
          </Link>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Site Scan V1 - 次世代ウェブサイト分析プラットフォーム
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;