// ローカルストレージによる分析履歴管理サービス

export interface LocalAnalysis {
  id: string;
  url: string;
  status: string;
  startedAt: string;
  score?: number;
  analyzedAt: string;
  results?: any;
}

class LocalHistoryService {
  private readonly STORAGE_KEY = 'site-scan-history';
  private readonly MAX_HISTORY_ITEMS = 100;

  /**
   * 分析結果をローカルストレージに保存
   */
  saveAnalysis(analysis: LocalAnalysis): void {
    try {
      const history = this.getHistory();
      
      // 重複チェック（同じIDは更新）
      const existingIndex = history.findIndex(item => item.id === analysis.id);
      if (existingIndex !== -1) {
        history[existingIndex] = analysis;
      } else {
        history.unshift(analysis);
      }

      // 上限制限
      if (history.length > this.MAX_HISTORY_ITEMS) {
        history.splice(this.MAX_HISTORY_ITEMS);
      }

      this.saveHistory(history);
      console.log('📁 ローカル履歴に保存:', analysis.id);
    } catch (error) {
      console.error('ローカル履歴保存エラー:', error);
    }
  }

  /**
   * ローカル履歴を取得
   */
  getHistory(): LocalAnalysis[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const history = JSON.parse(data) as LocalAnalysis[];
      
      // 日付順でソート（新しい順）
      return history.sort((a, b) => 
        new Date(b.analyzedAt || b.startedAt).getTime() - 
        new Date(a.analyzedAt || a.startedAt).getTime()
      );
    } catch (error) {
      console.error('ローカル履歴取得エラー:', error);
      return [];
    }
  }

  /**
   * 特定の分析結果を取得
   */
  getAnalysisById(id: string): LocalAnalysis | null {
    try {
      const history = this.getHistory();
      return history.find(item => item.id === id) || null;
    } catch (error) {
      console.error('分析結果取得エラー:', error);
      return null;
    }
  }

  /**
   * 分析結果を削除
   */
  removeAnalysis(id: string): boolean {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter(item => item.id !== id);
      
      if (filteredHistory.length !== history.length) {
        this.saveHistory(filteredHistory);
        console.log('🗑️ ローカル履歴から削除:', id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('履歴削除エラー:', error);
      return false;
    }
  }

  /**
   * 全履歴をクリア
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 ローカル履歴をクリア');
    } catch (error) {
      console.error('履歴クリアエラー:', error);
    }
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    total: number;
    completed: number;
    averageScore: number;
    successRate: number;
  } {
    try {
      const history = this.getHistory();
      const completed = history.filter(item => item.status === 'completed');
      const withScores = completed.filter(item => item.score);
      
      return {
        total: history.length,
        completed: completed.length,
        averageScore: withScores.length > 0 
          ? Math.round(withScores.reduce((sum, item) => sum + (item.score || 0), 0) / withScores.length)
          : 0,
        successRate: history.length > 0 
          ? Math.round((completed.length / history.length) * 100)
          : 0
      };
    } catch (error) {
      console.error('統計取得エラー:', error);
      return { total: 0, completed: 0, averageScore: 0, successRate: 0 };
    }
  }

  /**
   * ローカルストレージ使用量をチェック
   */
  getStorageInfo(): {
    used: string;
    available: string;
    percentage: number;
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY) || '';
      const used = new Blob([data]).size;
      const available = 5 * 1024 * 1024; // 5MB想定
      
      return {
        used: this.formatBytes(used),
        available: this.formatBytes(available),
        percentage: Math.round((used / available) * 100)
      };
    } catch (error) {
      console.error('ストレージ情報取得エラー:', error);
      return { used: '0B', available: '5MB', percentage: 0 };
    }
  }

  /**
   * データをエクスポート（JSON形式）
   */
  exportHistory(): string {
    try {
      const history = this.getHistory();
      return JSON.stringify({
        exported: new Date().toISOString(),
        version: '1.0',
        data: history
      }, null, 2);
    } catch (error) {
      console.error('履歴エクスポートエラー:', error);
      return '{}';
    }
  }

  /**
   * データをインポート
   */
  importHistory(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      
      if (!imported.data || !Array.isArray(imported.data)) {
        throw new Error('無効なデータ形式');
      }

      this.saveHistory(imported.data);
      console.log('📥 履歴データをインポート:', imported.data.length);
      return true;
    } catch (error) {
      console.error('履歴インポートエラー:', error);
      return false;
    }
  }

  // プライベートメソッド

  private saveHistory(history: LocalAnalysis[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
  }
}

// シングルトンインスタンス
export const localHistoryService = new LocalHistoryService();

export default localHistoryService;