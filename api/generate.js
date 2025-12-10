const OpenAI = require('openai');

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
            budget, period, persona, competitors, currentChannels, challenges,
            competitorUrl1, competitorUrl2, competitorUrl3
        } = req.body;

        if (!business || !product || !goal || !goalValue || !budget || !period || !persona) {
            return res.status(400).json({ error: '必須項目が不足しています' });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI APIキーが設定されていません' });
        }

        const goalLabel = GOAL_LABELS[goal] || goal;
        const businessTypeLabel = businessType === 'B2B' ? '法人向け（B2B）' :
                                  businessType === 'B2C' ? '個人向け（B2C）' : '法人・個人向け（B2B2C）';

        // 競合URLがあるかチェック
        const competitorUrls = [competitorUrl1, competitorUrl2, competitorUrl3].filter(url => url && url.trim());
        const hasCompetitors = competitorUrls.length > 0;

        let prompt = `あなたは10年以上の経験を持つシニアマーケティングストラテジストです。

【クライアント情報】
- ビジネスタイプ: ${businessTypeLabel}
- 事業内容: ${business}
- 商品/サービス: ${product}
- 目標: ${goalLabel} - ${goalValue}
- 月間予算: ${budget}
- 期間: ${period}
- ターゲット: ${persona}
${competitors ? `- 競合情報: ${competitors}` : ''}
${currentChannels ? `- 現在のチャネル: ${currentChannels}` : ''}
${challenges ? `- 課題: ${challenges}` : ''}
`;

        // 競合URL分析を追加
        if (hasCompetitors) {
            prompt += `
【競合サイト分析対象】
${competitorUrls.map((url, i) => `- 競合${i + 1}: ${url}`).join('\n')}

競合サイトのURLから、以下を推測・分析してください：
1. 競合のビジネスモデル・ターゲット層
2. 推定されるマーケティング戦略（SEO、広告、SNS等）
3. 強みと弱み
4. 使用している可能性が高いマーケティングチャネル
5. 差別化のポイント

`;
        }

        prompt += `
以下のJSON形式で回答してください：

{
  "summary": {
    "goal": "目標の要約",
    "budget": "月間予算",
    "period": "期間",
    "expectedRoi": "想定ROI"
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
      "traffic": [3000, 4500, 6500, 9000, 12000, 15000]
    },
    "channelEffectiveness": {
      "labels": ["Google検索", "ディスプレイ", "Facebook", "Instagram", "SEO", "メール"],
      "impact": [85, 60, 75, 70, 65, 80],
      "cost": [30, 20, 15, 15, 10, 10]
    },
    "monthlyRoi": {
      "labels": ["1月", "2月", "3月", "4月", "5月", "6月"],
      "investment": [100, 100, 100, 100, 100, 100],
      "return": [50, 100, 150, 200, 280, 350]
    }
  },`;

        if (hasCompetitors) {
            prompt += `
  "competitorAnalysis": {
    "competitors": [
      ${competitorUrls.map((url, i) => `{
        "name": "競合${i + 1}の推定社名",
        "url": "${url}",
        "estimatedTraffic": "推定月間訪問数",
        "mainChannels": "主要チャネル（SEO/広告/SNS等）",
        "strength": "推定される強み",
        "weakness": "推定される弱み",
        "marketingBudget": "推定マーケティング予算"
      }`).join(',\n      ')}
    ],
    "analysis": "<h4>競合マーケティング施策の分析</h4><p>詳細な分析...</p><h4>競合のSEO戦略</h4><ul><li>推定キーワード戦略</li></ul><h4>競合の広告戦略</h4><ul><li>推定広告出稿状況</li></ul><h4>競合のSNS戦略</h4><ul><li>各プラットフォームの活用状況</li></ul>",
    "swot": {
      "strengths": ["自社の強み1", "自社の強み2", "自社の強み3"],
      "weaknesses": ["自社の課題1", "自社の課題2"],
      "opportunities": ["市場機会1", "市場機会2", "市場機会3"],
      "threats": ["競合脅威1", "競合脅威2"]
    }
  },
  "differentiation": "<h4>差別化戦略</h4><p>競合と差別化するためのポイント...</p><h4>ポジショニング提案</h4><p>市場でのポジショニング...</p><h4>USP（独自の価値提案）</h4><ul><li>USP1</li><li>USP2</li></ul>",
  "winningTactics": "<h4>競合に勝つための具体的施策</h4><h4>短期施策（1-2ヶ月）</h4><ul><li>施策1: 詳細説明</li></ul><h4>中期施策（3-4ヶ月）</h4><ul><li>施策1: 詳細説明</li></ul><h4>長期施策（5ヶ月以降）</h4><ul><li>施策1: 詳細説明</li></ul><h4>競合の弱点を突く戦略</h4><table><tr><th>競合の弱点</th><th>攻略施策</th><th>期待効果</th></tr></table>",`;
        }

        prompt += `
  "overview": "<h4>戦略コンセプト</h4><p>...</p>",
  "kpi": "<h4>KGI</h4><table>...</table><h4>KPI</h4><table>...</table>",
  "budgetDetail": "<h4>予算配分</h4><table>...</table>",
  "adsStrategy": "<h4>広告戦略</h4>...",
  "growth": "<h4>成長戦略</h4>...",
  "tactics": "<h4>施策一覧</h4>...",
  "tasks": "<h4>週次タスク</h4>...",
  "priority": "<h4>優先順位</h4>...",
  "roadmap": "<h4>ロードマップ</h4>...",
  "forecast": "<h4>KPI予測</h4>..."
}

重要：
- 全ての数値は具体的に記載
- 競合分析は推測であることを前提に、可能な限り具体的に分析
- 差別化戦略は実行可能で具体的な提案を含める
- 必ず有効なJSONで返答`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
            strategy = generateFallbackData(goalLabel, goalValue, budget, period, hasCompetitors, competitorUrls);
        }

        // 競合分析フラグを追加
        strategy.hasCompetitorAnalysis = hasCompetitors;

        res.status(200).json(strategy);

    } catch (error) {
        console.error('戦略生成エラー:', error);
        res.status(500).json({
            error: '戦略の生成に失敗しました',
            message: error.message
        });
    }
};

function generateFallbackData(goalLabel, goalValue, budget, period, hasCompetitors, competitorUrls) {
    const data = {
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
                traffic: [3000, 5000, 7500, 10000, 13000, 16000]
            },
            channelEffectiveness: {
                labels: ["Google検索", "ディスプレイ", "Facebook", "Instagram", "SEO", "メール"],
                impact: [85, 55, 70, 65, 80, 60],
                cost: [30, 15, 20, 15, 10, 10]
            },
            monthlyRoi: {
                labels: ["1ヶ月目", "2ヶ月目", "3ヶ月目", "4ヶ月目", "5ヶ月目", "6ヶ月目"],
                investment: [100, 100, 100, 100, 100, 100],
                return: [40, 80, 140, 200, 280, 380]
            }
        },
        overview: `<h4>戦略コンセプト</h4><p>${goalLabel}を実現するための統合マーケティング戦略です。</p>`,
        kpi: `<h4>KGI</h4><p>${goalLabel}: ${goalValue}</p>`,
        budgetDetail: `<h4>予算配分</h4><p>月間予算${budget}を効率的に配分します。</p>`,
        adsStrategy: `<h4>広告戦略</h4><p>Google広告とSNS広告を組み合わせた統合戦略を展開します。</p>`,
        growth: `<h4>成長戦略</h4><p>AARRRフレームワークに基づく成長戦略を実行します。</p>`,
        tactics: `<h4>施策一覧</h4><p>複合的なマーケティング施策を展開します。</p>`,
        tasks: `<h4>タスク</h4><p>${period}の期間で段階的に実行します。</p>`,
        priority: `<h4>優先順位</h4><p>ROIの高い施策から順次実行します。</p>`,
        roadmap: `<h4>ロードマップ</h4><p>${period}の実行計画です。</p>`,
        forecast: `<h4>KPI予測</h4><p>期間終了時に${goalValue}の達成を目指します。</p>`,
        hasCompetitorAnalysis: hasCompetitors
    };

    if (hasCompetitors) {
        data.competitorAnalysis = {
            competitors: competitorUrls.map((url, i) => ({
                name: `競合${i + 1}`,
                url: url,
                estimatedTraffic: "5,000-10,000/月",
                mainChannels: "SEO、リスティング広告",
                strength: "ブランド認知度",
                weakness: "価格競争力",
                marketingBudget: "50-100万円/月"
            })),
            analysis: `<h4>競合分析</h4><p>競合のマーケティング戦略を分析しました。</p>`,
            swot: {
                strengths: ["独自の価値提案", "価格競争力", "顧客サポート"],
                weaknesses: ["認知度の低さ", "リソース制約"],
                opportunities: ["市場成長", "競合の弱点", "新規チャネル"],
                threats: ["価格競争", "新規参入", "技術変化"]
            }
        };
        data.differentiation = `<h4>差別化戦略</h4><p>競合と差別化するためのポイントを提案します。</p>`;
        data.winningTactics = `<h4>競合に勝つための施策</h4><p>具体的な施策を提案します。</p>`;
    }

    return data;
}
