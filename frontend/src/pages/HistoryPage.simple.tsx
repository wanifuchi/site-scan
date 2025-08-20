import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { useAuth, useAdminAuth } from '../contexts/AuthContext';
import { localHistoryService, LocalAnalysis } from '../services/LocalHistoryService';

interface SimpleAnalysis {
  id: string;
  url: string;
  status: string;
  startedAt: string;
  score?: number;
}

const HistoryPageSimple: React.FC = () => {
  const [analyses, setAnalyses] = useState<SimpleAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'local' | 'admin'>('local');
  
  const { authState, logout } = useAuth();
  const { isAdmin, getAuthHeaders } = useAdminAuth();

  useEffect(() => {
    loadHistory();
  }, [viewMode, isAdmin]);

  // 管理者認証状態が変更された時に表示モードを切り替え（UI非表示で内部ロジックのみ）
  useEffect(() => {
    if (isAdmin) {
      setViewMode('admin');
    } else {
      setViewMode('local');
    }
  }, [isAdmin]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (viewMode === 'local') {
        // ローカルストレージから履歴を読み込み
        console.log('📁 ローカル履歴を読み込み...');
        const localHistory = localHistoryService.getHistory();
        
        // LocalAnalysisをSimpleAnalysisに変換
        const convertedHistory: SimpleAnalysis[] = localHistory.map(item => ({
          id: item.id,
          url: item.url,
          status: item.status,
          startedAt: item.startedAt,
          score: item.score
        }));
        
        setAnalyses(convertedHistory);
        console.log(`📊 ローカル履歴 ${convertedHistory.length}件を読み込み完了`);
      } else {
        // 管理者用: APIから全履歴を取得
        console.log('🔐 管理者履歴を取得...');
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://site-scan-production.up.railway.app';
        console.log('API Base URL:', API_BASE_URL);
        
        const response = await fetch(`${API_BASE_URL}/api/analysis/history?page=1&limit=20`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('認証が必要です。ログインしてください。');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.success && data.data && data.data.analyses) {
          setAnalyses(data.data.analyses);
        } else if (data.success && data.analyses) {
          setAnalyses(data.analyses);
        } else {
          setAnalyses([]);
        }
      }
      
    } catch (err: any) {
      console.error('履歴取得エラー:', err);
      setError(err.message || '履歴の取得に失敗しました');
      
      if (viewMode === 'local') {
        // ローカルモードの場合は空配列
        setAnalyses([]);
      } else {
        // エラーの場合は空配列を設定
        setAnalyses([]);
      }
    } finally {
      setLoading(false);
    }
  };


  const handleScreenshot = async () => {
    try {
      const element = document.body;
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 1,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      const link = document.createElement('a');
      link.download = `analysis-history-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      alert('スクリーンショットが保存されました');
    } catch (error) {
      console.error('スクリーンショットエラー:', error);
      alert('スクリーンショットの保存に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">完了</span>;
      case 'processing':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">処理中</span>;
      case 'failed':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">失敗</span>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-cyan-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}分前`;
    } else if (hours < 24) {
      return `${hours}時間前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500/30 border-t-cyan-400"></div>
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">履歴を読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <div className="bg-slate-900/80 backdrop-blur-xl shadow-xl border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                分析履歴
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-400">📱 ローカル履歴</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleScreenshot}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 font-medium"
              >
                📸 スクリーンショット
              </button>
              <Link 
                to="/" 
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-medium"
              >
                新しい分析
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-red-400">⚠️</span>
              <span className="font-medium">
                ローカル履歴エラー
              </span>
            </div>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {analyses.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center shadow-2xl">
            <div className="text-6xl mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">📊</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-3">
              ローカル履歴がありません
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              ブラウザで分析を実行すると、結果がここに保存されます。新しい分析を開始してください。
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-medium text-lg"
            >
              分析を開始
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      スコア
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      分析日時
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/30 divide-y divide-slate-700/30">
                  {analyses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/30 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-200">{item.url}</div>
                        <div className="text-xs text-slate-400">ID: {item.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.score ? (
                          <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                            {item.score}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatDate(item.startedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {item.status === 'completed' ? (
                          <>
                            <Link
                              to={`/analysis/${item.id}`}
                              className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                            >
                              詳細を見る
                            </Link>
                          </>
                        ) : item.status === 'processing' ? (
                          <span className="text-slate-400">処理中...</span>
                        ) : (
                          <button
                            onClick={() => alert('再分析機能は開発中です')}
                            className="text-orange-400 hover:text-orange-300 transition-colors duration-200"
                          >
                            再分析
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 統計情報 */}
        {analyses.length > 0 && (
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="text-sm text-slate-400 mb-2">総分析数</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {analyses.length}
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="text-sm text-slate-400 mb-2">成功率</div>
              <div className="text-3xl font-bold text-green-400">
                {Math.round((analyses.filter(h => h.status === 'completed').length / analyses.length) * 100)}%
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="text-sm text-slate-400 mb-2">平均スコア</div>
              <div className="text-3xl font-bold text-blue-400">
                {analyses.filter(h => h.score).length > 0 ? Math.round(
                  analyses
                    .filter(h => h.score)
                    .reduce((sum, h) => sum + (h.score || 0), 0) / 
                  analyses.filter(h => h.score).length
                ) : 0}
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="text-sm text-slate-400 mb-2">最新分析</div>
              <div className="text-sm font-medium text-slate-200">
                {formatDate(analyses[0].startedAt)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPageSimple;