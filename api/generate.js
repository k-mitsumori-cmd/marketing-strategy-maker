import OpenAI from 'openai';

/**
 * マーケティング戦略生成API
 * Vercel Serverless Function
 */

// 目標のラベルマッピング
const GOAL_LABELS = {
    lead: 'リード獲得',
    awareness: '認知度向上',
    conversion: 'コンバージョン率改善',
    retention: '顧客維持率向上',
    revenue: '売上増加',
    cpa: 'CPA改善',
    traffic: 'サイト流入増加',
    engagement: 'エンゲージメント向上',
    other: 'その他'
};

export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // POSTのみ許可
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            businessType,
            business,
            product,
            goal,
            goalValue,
            budget,
            period,
            persona,
            competitors,
            currentChannels,
            challenges
        } = req.body;

        // バリデーション
        if (!business || !product || !goal || !goalValue || !budget || !period || !persona) {
            return res.status(400).json({
                error: '必須項目が不足しています',
                message: '事業内容、商品/サービス、目標、目標数値、予算、期間、ターゲット情報は必須です'
            });
        }

        // OpenAI APIキーの確認
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not set');
            return res.status(500).json({
                error: 'OpenAI APIキーが設定されていません',
                message: '環境変数 OPENAI_API_KEY を設定してください'
            });
        }

        const goalLabel = GOAL_LABELS[goal] || goal;
        const businessTypeLabel = businessType === 'B2B' ? '法人向け（B2B）' :
                                  businessType === 'B2C' ? '個人向け（B2C）' : '法人・個人向け（B2B2C）';

        // システムプロンプト
        const systemPrompt = `あなたは、10年以上の経験を持つシニアマーケティングストラテジストです。
デジタルマーケティング、グロースハック、セールスファネル設計に精通しています。
クライアントのビジネス情報を分析し、実行可能で効果的なマーケティング戦略を立案します。

回答は必ず以下のJSON形式で返してください（各セクションはHTML形式）：
{
  "overview": "<h4>...</h4><p>...</p>",
  "kpi": "<h4>...</h4><table>...</table>",
  "growth": "<h4>...</h4><ul>...</ul>",
  "tactics": "<h4>...</h4><table>...</table>",
  "tasks": "<h4>...</h4><ul>...</ul>",
  "priority": "<h4>...</h4><table>...</table>",
  "roadmap": "<h4>...</h4><table>...</table>",
  "forecast": "<h4>...</h4><table>...</table>"
}

HTML出力のルール：
- セクション見出しは<h4>タグを使用
- 段落は<p>タグ、リストは<ul><li>タグ、強調は<strong>タグを使用
- 表は<table><tr><th><td>タグを使用
- 優先度の高い項目には<span class="priority-high">最優先</span>、中は<span class="priority-medium">重要</span>、低は<span class="priority-low">推奨</span>を使用`;

        // ユーザープロンプト
        const userPrompt = `以下のビジネス情報に基づいて、包括的なマーケティング戦略を立案してください。

【ビジネスタイプ】
${businessTypeLabel}

【事業内容】
${business}

【商品/サービスの説明】
${product}

【目標】
${goalLabel}: ${goalValue}

【予算】
${budget}/月

【期間】
${period}

【ターゲット情報（ペルソナ）】
${persona}

${competitors ? `【競合情報】\n${competitors}\n` : ''}
${currentChannels ? `【現在の集客チャネル】\n${currentChannels}\n` : ''}
${challenges ? `【現状の課題】\n${challenges}\n` : ''}

以下の8つのセクションを含む戦略レポートを作成してください：

1. **マーケティング戦略の全体像**（${businessTypeLabel}に最適化）
   - 戦略コンセプト、基本方針、ターゲット戦略

2. **目的・KPI・KGI整理**
   - KGI（重要目標達成指標）の設定
   - KPI（重要業績評価指標）の設定と目標値
   - ファネル各段階の指標

3. **成長戦略（AARRR）**
   - Acquisition（獲得）
   - Activation（活性化）
   - Retention（継続）
   - Revenue（収益）
   - Referral（紹介）

4. **施策一覧**
   - 広告施策（種類、目的、予算配分）
   - SEO/コンテンツ施策
   - SNS施策
   - セールス連携施策

5. **詳細タスク**
   - 初月のタスク
   - 2-3ヶ月目のタスク
   - 4ヶ月目以降のタスク

6. **施策の優先順位**
   - Impact/Effortマトリクス
   - 推奨実行順序

7. **月次ロードマップ**
   - ${period}分の月別計画
   - フェーズ、主要タスク、マイルストーン

8. **想定KPI推移予測**
   - 月別のKPI予測
   - 想定ROI

必ずJSON形式で返答してください。`;

        // OpenAI API呼び出し
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0].message.content;
        
        // JSONパース
        let strategy;
        try {
            strategy = JSON.parse(responseContent);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // JSONパースに失敗した場合、テキストとして処理
            strategy = {
                overview: `<p>${responseContent}</p>`,
                kpi: '',
                growth: '',
                tactics: '',
                tasks: '',
                priority: '',
                roadmap: '',
                forecast: ''
            };
        }

        // レスポンス
        res.status(200).json(strategy);

    } catch (error) {
        console.error('戦略生成エラー:', error);
        
        // エラーの種類に応じたレスポンス
        if (error.code === 'insufficient_quota') {
            return res.status(429).json({
                error: 'APIの利用制限に達しました',
                message: 'OpenAI APIのクォータを確認してください'
            });
        }
        
        if (error.code === 'invalid_api_key') {
            return res.status(401).json({
                error: 'APIキーが無効です',
                message: 'OpenAI APIキーを確認してください'
            });
        }

        res.status(500).json({
            error: '戦略の生成に失敗しました',
            message: error.message
        });
    }
}
