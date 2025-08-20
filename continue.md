# Site Scan V1 開発継続ガイド

## 📋 プロジェクト概要
- **プロジェクト名**: Site Scan V1 (SiteScan)
- **説明**: AI駆動Web解析ツール - URLを入力するだけで、AIがウェブサイトを多角的に徹底分析し、具体的な改善提案まで提供
- **デプロイ環境**: Railway (https://site-scan-production.up.railway.app)
- **GitHub**: https://github.com/wanifuchi/site-scan

## 🚀 2025年8月20日の作業内容

### 1. Google Search Console API 設定
#### ✅ 完了した作業
- Google Cloud Console でサービスアカウント作成済み
  - サービスアカウント: `site-scan-search-console@analystic-1749770854209.iam.gserviceaccount.com`
  - JSONキーファイル: `analystic-1749770854209-3bbb2c9568e2.json` (ローカル保存済み)
- Railway環境変数 `GOOGLE_SERVICE_ACCOUNT_KEY` 設定済み
- API認証ロジック実装済み (`backend/search-console-service.js`)

#### ⚠️ 未完了の作業
- **Google Search Console プロパティでの権限設定が必要**
  1. https://search.google.com/search-console にアクセス
  2. 対象サイトのプロパティを選択
  3. 「設定」→「ユーザーと権限」→「ユーザーを追加」
  4. サービスアカウントメール追加: `site-scan-search-console@analystic-1749770854209.iam.gserviceaccount.com`
  5. 権限レベル：「制限付き」（読み取り専用）

### 2. 管理者機能のUI隠蔽化
#### ✅ 完了した作業
- 履歴ページから管理者関連UI要素を削除
  - 表示モード切り替えボタン（🔐 管理者履歴）を削除
  - 管理者ログインボタンを削除
  - 管理者状態表示を削除
- 内部ロジックは維持（管理者ログイン時は管理者データを表示）
- 管理者ログイン時のみログアウトボタンを表示

#### 📝 仕様
- **一般ユーザー**: ローカル履歴のみ表示、管理者機能は完全に非表示
- **管理者**: `/admin` に直接アクセスしてログイン可能
- **管理者ログイン後**: データベースの全履歴を表示（UIは「ローカル履歴」と表示）

### 3. サイトメタ情報の更新
#### ✅ 完了した作業
- タイトル: `SiteScan│AI駆動Web解析ツール`
- メタディスクリプション: `URLを入力するだけで、AIがウェブサイトを多角的に徹底分析し、具体的な改善提案まで提供する分析ツールです。`

## 🔧 技術的な詳細

### モックデータ vs 実データ
#### 現在実データを使用している機能
- 総合評価スコア（PageSpeed Insights API）
- SEO分析（実際のHTML/メタデータ分析）
- パフォーマンス測定（PageSpeed Insights API）
- セキュリティチェック（実際のセキュリティヘッダー分析）
- アクセシビリティ分析（実際のアクセシビリティ監査）
- Core Web Vitals（PageSpeed Insights API）

#### モックデータを使用している機能
- **Google Search Console 関連データのみ**
  - 検索クエリ分析
  - 検索パフォーマンスデータ
  - キーワード別指標
  - ※権限設定完了後は実データに切り替わる

### 重要なファイルパス
```
backend/
├── server.js                    # メインサーバー（Railway修正済み）
├── search-console-service.js    # Google Search Console API統合
├── gemini-service.js            # Gemini AI分析サービス
└── package.json

frontend/
├── index.html                   # メタ情報設定
├── src/
│   ├── pages/
│   │   ├── HistoryPage.simple.tsx  # 履歴ページ（管理者UI隠蔽済み）
│   │   └── AdminLoginPage.tsx      # 管理者ログインページ
│   └── contexts/
│       └── AuthContext.tsx         # 認証コンテキスト
└── package.json
```

## 📊 環境変数（Railway）
```env
# データベース
DATABASE_URL=postgresql://...

# Google Search Console API
GOOGLE_SERVICE_ACCOUNT_KEY={JSONキー内容}

# Gemini API
GEMINI_API_KEY=...

# 管理者認証
ADMIN_PASSWORD_HASH=...
JWT_SECRET=...
```

## ✅ 未完了タスク一覧

### 優先度：高
1. **Google Search Console プロパティ権限設定**
   - サービスアカウントに対象サイトへのアクセス権限を付与
   - 実データ取得の確認

### 優先度：中
2. **API接続テスト**
   - Search Console API の実データ取得確認
   - エラーハンドリングの検証

3. **管理者機能の最終テスト**
   - 管理者ログイン/ログアウトフロー確認
   - データベース履歴の表示確認

### 優先度：低
4. **パフォーマンス最適化**
   - フロントエンドのバンドルサイズ削減
   - API呼び出しのキャッシング

## 🚨 注意事項

### セキュリティ
- JSONキーファイルは絶対にGitにコミットしない
- 環境変数は Railway のダッシュボードで管理
- 管理者パスワードは定期的に変更推奨

### Railway デプロイメント
- GitHubへのプッシュで自動デプロイ
- ビルドエラー時は Railway ダッシュボードで確認
- 環境変数変更後は再デプロイが必要

### 既知の問題
1. **regex エラー対策済み**: `server.js` の正規表現を環境依存しない形に修正済み
2. **ファイル重複**: " 2" サフィックス付きファイルは削除済み

## 🔄 次回開発再開時のチェックリスト

- [ ] Railway デプロイメントの状態確認
- [ ] Google Search Console 権限設定の確認
- [ ] 環境変数の確認（特に `GOOGLE_SERVICE_ACCOUNT_KEY`）
- [ ] 管理者ログイン機能の動作確認
- [ ] モックデータから実データへの切り替え確認

## 📞 関連リンク

- **本番サイト**: https://site-scan-production.up.railway.app
- **Railway ダッシュボード**: Railway にログイン
- **GitHub リポジトリ**: https://github.com/wanifuchi/site-scan
- **Google Cloud Console**: https://console.cloud.google.com
- **Google Search Console**: https://search.google.com/search-console

---

最終更新: 2025年8月20日
作業者: Claude Code (Serena) with Noriaki