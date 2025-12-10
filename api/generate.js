const OpenAI = require('openai');

/**
 * マーケティング戦略生成API
 * Vercel Serverless Function
 */

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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            businessType, business, product, goal, goalValue,
            budget, period, persona, competitors, currentChannels, challenges
        } = req.body;

        if (!business || !product || !goal || !goalValue || !budget || !period || !persona) {
            return res.status(400).json({
                error: '必須項目が不足しています'
            });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                error: 'OpenAI APIキーが設定されていません'
            });
        }

        const goalLabel = GOAL_LABELS[goal] || goal;
        const businessTypeLabel = businessType === 'B2B' ? '法人向け（B2B）' :
                                  businessType === 'B2C' ? '個人向け（B2C）' : '法人・個人向け（B2B2C）';

        const prompt = `あなたは10年以上の経験を持つシニアマーケティングストラテジストです。

【入力情報】
- ビジネスタイプ: ${businessTypeLabel}
- 事業内容: ${business}
- 商品/サービス: ${product}
- 目標: ${goalLabel} - ${goalValue}
- 月間予算: ${budget}
- 期間: ${period}
- ターゲット: ${persona}
${competitors ? `- 競合: ${competitors}` : ''}
${currentChannels ? `- 現在のチャネル: ${currentChannels}` : ''}
${challenges ? `- 課題: ${challenges}` : ''}

以下のJSON形式で、非常に詳細で具体的なマーケティング戦略を回答してください。
数値は必ず具体的な金額・パーセンテージで記載してください。

{
  "summary": {
    "goal": "目標の要約",
    "budget": "月間予算",
    "period": "期間",
    "expectedRoi": "想定ROI（例：250%）"
  },
  "chartData": {
    "budgetAllocation": {
      "labels": ["Google広告", "SNS広告", "コンテンツ制作", "SEO対策", "その他"],
      "values": [35, 25, 20, 15, 5],
      "amounts": ["35万円", "25万円", "20万円", "15万円", "5万円"]
    },
    "monthlyKpi": {
      "labels": ["1月", "2月", "3月", "4月", "5月", "6月"],
      "leads": [20, 35, 55, 80, 110, 150],
      "traffic": [3000, 4500, 6500, 9000, 12000, 15000],
      "conversion": [1.5, 1.8, 2.2, 2.5, 2.8, 3.0]
    },
    "channelEffectiveness": {
      "labels": ["Google検索", "Google Display", "Facebook", "Instagram", "LinkedIn", "コンテンツSEO"],
      "impact": [85, 60, 75, 70, 65, 80],
      "cost": [30, 20, 15, 15, 10, 10]
    },
    "monthlyRoi": {
      "labels": ["1月", "2月", "3月", "4月", "5月", "6月"],
      "investment": [100, 100, 100, 100, 100, 100],
      "return": [50, 100, 150, 200, 280, 350]
    }
  },
  "overview": "<h4>戦略コンセプト</h4><p>具体的な戦略説明...</p><h4>基本方針</h4><ul><li>方針1</li><li>方針2</li></ul>",
  "kpi": "<h4>KGI（重要目標達成指標）</h4><table>...</table><h4>KPI（重要業績評価指標）</h4><table>...</table>",
  "budgetDetail": "<h4>月間予算配分</h4><p>総予算: ${budget}</p><table><tr><th>項目</th><th>金額</th><th>比率</th><th>用途</th></tr>...</table><h4>推奨予算配分の理由</h4><ul><li>理由1</li></ul>",
  "adsStrategy": "<h4>広告出稿戦略</h4><h4>Google広告</h4><table><tr><th>キャンペーン</th><th>予算</th><th>CPC目標</th><th>ターゲティング</th></tr>...</table><h4>SNS広告</h4><table>...</table><h4>推奨出稿スケジュール</h4><p>具体的なスケジュール...</p>",
  "growth": "<h4>Acquisition（獲得）</h4><ul><li>施策1: 詳細説明</li></ul><h4>Activation（活性化）</h4><ul>...</ul>...",
  "tactics": "<h4>広告施策</h4><table>...</table><h4>SEO/コンテンツ施策</h4><table>...</table>",
  "tasks": "<h4>Week 1-2: 準備フェーズ</h4><ul><li>タスク1: 詳細</li></ul><h4>Week 3-4: 実行フェーズ</h4><ul>...</ul>...",
  "priority": "<h4>Impact/Effort マトリクス</h4><table>...</table><h4>推奨実行順序</h4><ol><li>優先度1</li></ol>",
  "roadmap": "<h4>月次ロードマップ</h4><table><tr><th>月</th><th>フェーズ</th><th>主要施策</th><th>KPI目標</th><th>マイルストーン</th></tr>...</table>",
  "forecast": "<h4>KPI推移予測</h4><table><tr><th>月</th><th>訪問数</th><th>リード数</th><th>CVR</th><th>CPA</th><th>累計投資</th><th>累計リターン</th></tr>...</table><h4>ROI分析</h4><p>詳細分析...</p>"
}

重要：
- 全ての数値は具体的に（例：月間35件、CPA 15,000円、CVR 2.5%）
- 広告出稿戦略は媒体別に詳細に（Google、Meta、LinkedIn等）
- タスクは週単位で具体的に
- 予算配分は金額と比率の両方を記載
- chartDataの数値は期間に合わせて調整

必ず有効なJSONで返答してください。`;

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4000
        });

        const responseContent = completion.choices[0].message.content;
        
        let jsonStr = responseContent;
        const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        
        let strategy;
        try {
            strategy = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // フォールバック用のデフォルトデータ
            strategy = generateFallbackData(goalLabel, goalValue, budget, period);
        }

        res.status(200).json(strategy);

    } catch (error) {
        console.error('戦略生成エラー:', error);
        res.status(500).json({
            error: '戦略の生成に失敗しました',
            message: error.message
        });
    }
};

// フォールバック用データ生成
function generateFallbackData(goalLabel, goalValue, budget, period) {
    return {
        summary: {
            goal: `${goalLabel}: ${goalValue}`,
            budget: budget,
            period: period,
            expectedRoi: "200-300%"
        },
        chartData: {
            budgetAllocation: {
                labels: ["Google広告", "SNS広告", "コンテンツ制作", "SEO対策", "その他"],
                values: [35, 25, 20, 15, 5],
                amounts: ["35%", "25%", "20%", "15%", "5%"]
            },
            monthlyKpi: {
                labels: ["1ヶ月目", "2ヶ月目", "3ヶ月目", "4ヶ月目", "5ヶ月目", "6ヶ月目"],
                leads: [20, 40, 65, 90, 120, 150],
                traffic: [3000, 5000, 7500, 10000, 13000, 16000],
                conversion: [1.5, 1.8, 2.1, 2.4, 2.7, 3.0]
            },
            channelEffectiveness: {
                labels: ["Google検索", "ディスプレイ", "Facebook", "Instagram", "コンテンツSEO", "メール"],
                impact: [85, 55, 70, 65, 80, 60],
                cost: [30, 15, 20, 15, 10, 10]
            },
            monthlyRoi: {
                labels: ["1ヶ月目", "2ヶ月目", "3ヶ月目", "4ヶ月目", "5ヶ月目", "6ヶ月目"],
                investment: [100, 100, 100, 100, 100, 100],
                return: [40, 80, 140, 200, 280, 380]
            }
        },
        overview: `<h4>戦略コンセプト</h4><p>データドリブンなアプローチで${goalLabel}を実現します。</p>`,
        kpi: `<h4>KGI</h4><p>${goalLabel}: ${goalValue}</p>`,
        budgetDetail: `<h4>予算配分</h4><p>月間予算${budget}を効率的に配分します。</p>`,
        adsStrategy: `<h4>広告戦略</h4><p>Google広告とSNS広告を組み合わせた統合戦略を展開します。</p>`,
        growth: `<h4>成長戦略</h4><p>AARRRフレームワークに基づく成長戦略を実行します。</p>`,
        tactics: `<h4>施策一覧</h4><p>複合的なマーケティング施策を展開します。</p>`,
        tasks: `<h4>タスク</h4><p>${period}の期間で段階的に実行します。</p>`,
        priority: `<h4>優先順位</h4><p>ROIの高い施策から順次実行します。</p>`,
        roadmap: `<h4>ロードマップ</h4><p>${period}の実行計画です。</p>`,
        forecast: `<h4>KPI予測</h4><p>期間終了時に${goalValue}の達成を目指します。</p>`
    };
}
