const OpenAI = require('openai');

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

module.exports = async function handler(req, res) {
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

        // プロンプト
        const prompt = `あなたは10年以上の経験を持つシニアマーケティングストラテジストです。
以下のビジネス情報に基づいて、包括的なマーケティング戦略を立案してください。

【ビジネスタイプ】${businessTypeLabel}
【事業内容】${business}
【商品/サービス】${product}
【目標】${goalLabel}: ${goalValue}
【予算】${budget}/月
【期間】${period}
【ターゲット】${persona}
${competitors ? `【競合】${competitors}` : ''}
${currentChannels ? `【現在のチャネル】${currentChannels}` : ''}
${challenges ? `【課題】${challenges}` : ''}

以下のJSON形式で回答してください。各セクションはHTML形式で記述してください：

{
  "overview": "戦略の全体像（h4タグで見出し、pタグで段落、ulタグでリスト）",
  "kpi": "KPI/KGI整理（tableタグで表形式）",
  "growth": "成長戦略AARRR（h4タグで各段階、ulタグでリスト）",
  "tactics": "施策一覧（tableタグで表形式）",
  "tasks": "詳細タスク（h4タグでフェーズ別、ulタグでリスト）",
  "priority": "優先順位（tableタグでImpact/Effortマトリクス）",
  "roadmap": "月次ロードマップ（tableタグで表形式）",
  "forecast": "KPI推移予測（tableタグで表形式）"
}

HTMLタグのルール：
- 見出しは<h4>タグ
- 段落は<p>タグ
- リストは<ul><li>タグ
- 強調は<strong>タグ
- 表は<table><tr><th><td>タグ
- 優先度高は<span class="priority-high">最優先</span>
- 優先度中は<span class="priority-medium">重要</span>
- 優先度低は<span class="priority-low">推奨</span>

必ず有効なJSONで返答してください。`;

        // OpenAI API呼び出し
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        console.log('Calling OpenAI API...');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        console.log('OpenAI API response received');

        const responseContent = completion.choices[0].message.content;
        
        // JSONを抽出（マークダウンコードブロックがある場合に対応）
        let jsonStr = responseContent;
        const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        
        // JSONパース
        let strategy;
        try {
            strategy = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response content:', responseContent);
            // JSONパースに失敗した場合、テキストとして処理
            strategy = {
                overview: `<h4>戦略概要</h4><p>${responseContent.substring(0, 500)}...</p>`,
                kpi: '<p>パース エラーが発生しました</p>',
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
        console.error('Error details:', JSON.stringify(error, null, 2));
        
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
};
