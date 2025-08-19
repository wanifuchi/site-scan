import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

// 認証関連
const adminTokens = new Set<string>(); // 管理者トークン管理
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sitescan_admin_2025';

// 認証ミドルウェア
const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({
      success: false,
      error: '管理者認証が必要です'
    });
  }
  
  next();
};

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 基本的なルート
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Site Scan V1 API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 分析開始のモックエンドポイント
app.post('/api/analysis/start', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URLは必須です'
    });
  }

  // URLバリデーション
  try {
    new URL(url);
  } catch {
    return res.status(400).json({
      success: false,
      error: '有効なURLを入力してください'
    });
  }

  const analysisId = `analysis-${Date.now()}`;
  
  res.status(201).json({
    success: true,
    data: {
      id: analysisId,
      url: url,
      status: 'pending',
      startedAt: new Date().toISOString()
    }
  });
});

// 管理者ログイン
app.post('/api/auth/admin', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'パスワードが正しくありません'
      });
    }
    
    // トークン生成
    const token = crypto.randomBytes(32).toString('hex');
    adminTokens.add(token);
    
    // トークンの有効期限設定（24時間）
    setTimeout(() => {
      adminTokens.delete(token);
    }, 24 * 60 * 60 * 1000);
    
    res.json({
      success: true,
      data: {
        token,
        expiresIn: '24h',
        message: '管理者として認証されました'
      }
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'ログイン処理に失敗しました'
    });
  }
});

// 分析履歴（管理者限定）
app.get('/api/analysis/history', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      analyses: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    }
  });
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'エンドポイントが見つかりません'
  });
});

// エラーハンドラー
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'サーバー内部エラーが発生しました'
  });
});

const startServer = (): void => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();