# Marketing Strategy Maker

AIを活用したマーケティング戦略自動生成ツール

![Marketing Strategy Maker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 概要

**Marketing Strategy Maker**は、ユーザーが入力したビジネス情報を基に、AIが最適なマーケティング戦略を自動生成するWebアプリケーションです。

### 主な機能

- 🎯 B2B/B2C両対応のマーケティング戦略生成
- 📊 KPI/KGIの自動設定
- 🚀 AARRR成長戦略の提案
- 📝 施策一覧と詳細タスクの自動生成
- 🔢 Impact/Effortマトリクスによる優先順位付け
- 📅 月次ロードマップの作成
- 📈 KPI推移予測
- 📄 Markdown/PDFエクスポート機能

## 🖼️ スクリーンショット

### 入力フォーム
美しいUIで直感的にビジネス情報を入力

### 戦略レポート
AIが生成した包括的なマーケティング戦略を表示

### エクスポート機能
Markdown/PDF形式でダウンロード可能

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | HTML5, CSS3 (Tailwind風), JavaScript (ES6+) |
| バックエンド | Node.js, Vercel Serverless Functions |
| AI | OpenAI API (GPT-4) |
| UI/UX | Font Awesome, Google Fonts (Noto Sans JP) |
| エクスポート | jsPDF, html2canvas |
| デプロイ | Vercel |

## 📁 ディレクトリ構造

```
marketing-strategy-maker/
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── app.js              # フロントエンドロジック
├── api/
│   └── generate.js     # 戦略生成API（Vercel Serverless Function）
├── package.json        # 依存関係
├── vercel.json         # Vercel設定
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

## 🚀 セットアップ手順

### 前提条件

- Node.js 18以上
- npm または yarn
- OpenAI APIキー
- Vercel CLI（デプロイ用）

### ローカル開発

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/k-mitsumori-cmd/marketing-strategy-maker.git
   cd marketing-strategy-maker
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **環境変数を設定**
   ```bash
   # .env.local ファイルを作成
   echo "OPENAI_API_KEY=your-api-key-here" > .env.local
   ```

4. **開発サーバーを起動**
   ```bash
   npm run dev
   # または
   vercel dev
   ```

5. **ブラウザでアクセス**
   ```
   http://localhost:3000
   ```

### 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI APIキー | ✅ |

## 🌐 デプロイ手順（Vercel）

### 方法1: GitHub連携（推奨）

1. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Vercelにログイン**
   - [Vercel](https://vercel.com) にアクセス
   - GitHubアカウントでログイン

3. **新規プロジェクトを作成**
   - 「New Project」をクリック
   - GitHubリポジトリを選択
   - 「Import」をクリック

4. **環境変数を設定**
   - Settings → Environment Variables
   - `OPENAI_API_KEY` を追加

5. **デプロイ完了**
   - 自動的にデプロイが開始されます
   - 完了後、URLが発行されます

### 方法2: Vercel CLI

1. **Vercel CLIをインストール**
   ```bash
   npm install -g vercel
   ```

2. **ログイン**
   ```bash
   vercel login
   ```

3. **デプロイ**
   ```bash
   vercel --prod
   ```

4. **環境変数を設定**
   ```bash
   vercel env add OPENAI_API_KEY
   ```

## 📖 使い方

### 1. 入力フォーム

以下の情報を入力します：

| 項目 | 説明 | 必須 |
|------|------|------|
| ビジネスタイプ | B2B / B2C / B2B2C | ✅ |
| 事業内容 | 会社や事業の概要 | ✅ |
| 商品/サービス | 販売する商品やサービスの詳細 | ✅ |
| 目標 | 達成したい目標の種類 | ✅ |
| 目標数値 | 具体的な目標値 | ✅ |
| 予算 | 月間マーケティング予算 | ✅ |
| 期間 | 戦略実行期間 | ✅ |
| ターゲット情報 | ペルソナの詳細 | ✅ |
| 競合情報 | 主要競合と差別化ポイント | - |
| 現在の集客チャネル | 既存のマーケティングチャネル | - |
| 現状の課題 | 解決したい課題 | - |

### 2. 戦略生成

「戦略を生成する」ボタンをクリックすると、AIが以下の8セクションを含む戦略レポートを生成します：

1. **マーケティング戦略の全体像** - 戦略コンセプトと基本方針
2. **目的・KPI・KGI整理** - 指標と目標値の設定
3. **成長戦略（AARRR）** - グロースハックフレームワーク
4. **施策一覧** - 広告、SEO、SNS、セールス連携
5. **詳細タスク** - フェーズ別のタスクリスト
6. **施策の優先順位** - Impact/Effortマトリクス
7. **月次ロードマップ** - 月別の実行計画
8. **想定KPI推移予測** - 期待される成果予測

### 3. エクスポート

生成した戦略は以下の形式でエクスポートできます：

- **Markdown** (.md) - テキストエディタで編集可能
- **PDF** (.pdf) - 印刷・共有用
- **クリップボードにコピー** - 他のアプリに貼り付け

## 🔧 カスタマイズ

### スタイルの変更

`styles.css` のCSS変数を編集することで、テーマカラーを簡単に変更できます：

```css
:root {
    --primary: #6366f1;        /* メインカラー */
    --primary-dark: #4f46e5;   /* ダークバリアント */
    --primary-light: #818cf8;  /* ライトバリアント */
    --secondary: #f472b6;      /* セカンダリカラー */
    --accent: #22d3ee;         /* アクセントカラー */
}
```

### AIモデルの変更

`api/generate.js` でOpenAIのモデルを変更できます：

```javascript
const completion = await openai.chat.completions.create({
    model: 'gpt-4',  // または 'gpt-3.5-turbo' など
    // ...
});
```

## 📝 API仕様

### POST /api/generate

マーケティング戦略を生成します。

**リクエスト**

```json
{
  "businessType": "B2B",
  "business": "クラウド型会計ソフトの開発・販売",
  "product": "中小企業向けクラウド会計ソフト",
  "goal": "lead",
  "goalValue": "月間100件のリード獲得",
  "budget": "100-300万円",
  "period": "6ヶ月",
  "persona": "従業員10-50名の中小企業の経理担当者",
  "competitors": "弥生会計、freee",
  "currentChannels": "Google広告",
  "challenges": "CPAが高い"
}
```

**レスポンス**

```json
{
  "overview": "<h4>戦略コンセプト</h4><p>...</p>",
  "kpi": "<h4>KGI</h4><table>...</table>",
  "growth": "<h4>Acquisition</h4><ul>...</ul>",
  "tactics": "<h4>広告施策</h4><table>...</table>",
  "tasks": "<h4>初月</h4><ul>...</ul>",
  "priority": "<h4>Impact/Effort マトリクス</h4><table>...</table>",
  "roadmap": "<h4>月次ロードマップ</h4><table>...</table>",
  "forecast": "<h4>想定KPI推移</h4><table>...</table>"
}
```

## 🐛 トラブルシューティング

### よくある問題

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| APIエラー | APIキー未設定 | 環境変数 `OPENAI_API_KEY` を設定 |
| 404エラー | APIルートの問題 | `vercel.json` の設定を確認 |
| 戦略が生成されない | APIクォータ超過 | OpenAIダッシュボードで確認 |
| スタイルが崩れる | CSS未読み込み | ファイルパスを確認 |

### デバッグ

ブラウザの開発者ツール（F12）でコンソールログを確認してください。

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストや Issue は大歓迎です！

1. Fork する
2. Feature branch を作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request を作成

## 📞 サポート

問題や質問がある場合は、GitHub Issues でお知らせください。

---

Made with ❤️ using AI
