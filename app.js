/**
 * Marketing Strategy Maker - フロントエンドロジック
 * AIを活用したマーケティング戦略自動生成ツール
 */

const API_URL = (() => {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    return isLocalhost ? 'http://localhost:3000/api/generate' : '/api/generate';
})();

// サンプルデータ
const SAMPLE_DATA_ARRAY = [
    {
        businessType: 'B2B',
        business: 'クラウド型会計ソフトの開発・販売を行うSaaSスタートアップ',
        product: '中小企業向けに設計されたクラウド会計ソフト「MoneyFlow」。AIによる自動仕訳機能、リアルタイム銀行連携、カスタマイズ可能なレポート生成機能を搭載。月額9,800円からのサブスクリプションモデルで、導入後の経理業務を最大70%効率化。',
        goal: 'lead',
        goalValue: '月間100件の無料トライアル申込',
        budget: '100-300万円',
        period: '6ヶ月',
        persona: '従業員10-50名の中小企業。主に経理担当者（30-50代女性）または経営者（40-60代男性）。現在はExcelや古い会計ソフトを使用しており、業務効率化に強い関心。ITリテラシーは中程度で、導入の手軽さを重視。',
        competitors: '弥生会計、freee、マネーフォワード',
        currentChannels: 'Google広告、展示会出展',
        challenges: 'CPAが高く、認知度が低い。無料トライアルからの有料転換率を改善したい。'
    },
    {
        businessType: 'B2C',
        business: 'オンラインフィットネスプログラムの提供',
        product: '自宅でできるパーソナライズされたフィットネスプログラム「FitHome」。AIが体型・目標・生活スタイルに合わせた最適なトレーニングメニューを自動生成。ライブレッスンとオンデマンド動画の両方を提供。月額2,980円から。',
        goal: 'conversion',
        goalValue: '無料体験からの有料転換率30%',
        budget: '50-100万円',
        period: '3ヶ月',
        persona: '20-40代の働く女性。運動不足を感じているが、ジムに通う時間がない。健康意識が高く、SNSでの情報収集が活発。スマートフォンの利用頻度が高い。',
        competitors: 'LEAN BODY、SOELU',
        currentChannels: 'Instagram広告、インフルエンサーマーケティング',
        challenges: '競合が多く差別化が難しい。継続率の向上が課題。'
    }
];

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

let currentFormData = null;
let generatedStrategy = null;
let progressInterval = null;
let charts = {};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const form = document.getElementById('strategy-form');
    form.addEventListener('submit', handleFormSubmit);
    
    document.getElementById('sample-btn').addEventListener('click', fillSampleData);
    
    setupCharCount('business', 500);
    setupCharCount('product', 1000);
    setupCharCount('persona', 1000);
    
    document.getElementById('regenerate-btn')?.addEventListener('click', handleRegenerate);
    document.getElementById('edit-btn')?.addEventListener('click', handleEdit);
    
    document.getElementById('export-markdown-btn')?.addEventListener('click', exportMarkdown);
    document.getElementById('copy-btn')?.addEventListener('click', copyToClipboard);
    
    setupCardToggles();
}

function setupCharCount(fieldId, maxCount) {
    const field = document.getElementById(fieldId);
    const countSpan = document.getElementById(`${fieldId}-count`);
    
    if (field && countSpan) {
        field.addEventListener('input', () => {
            const count = field.value.length;
            countSpan.textContent = count;
            countSpan.style.color = count > maxCount ? 'var(--error)' : 'var(--gray-400)';
        });
    }
}

function fillSampleData() {
    const sample = SAMPLE_DATA_ARRAY[Math.floor(Math.random() * SAMPLE_DATA_ARRAY.length)];
    
    const radioBtn = document.querySelector(`input[name="businessType"][value="${sample.businessType}"]`);
    if (radioBtn) radioBtn.checked = true;
    
    document.getElementById('business').value = sample.business;
    document.getElementById('product').value = sample.product;
    document.getElementById('goal').value = sample.goal;
    document.getElementById('goalValue').value = sample.goalValue;
    document.getElementById('budget').value = sample.budget;
    document.getElementById('period').value = sample.period;
    document.getElementById('persona').value = sample.persona;
    document.getElementById('competitors').value = sample.competitors || '';
    document.getElementById('currentChannels').value = sample.currentChannels || '';
    document.getElementById('challenges').value = sample.challenges || '';
    
    updateCharCounts();
    showToast('サンプルデータを入力しました');
}

function updateCharCounts() {
    ['business', 'product', 'persona'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const countSpan = document.getElementById(`${fieldId}-count`);
        if (field && countSpan) {
            countSpan.textContent = field.value.length;
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = collectFormData();
    currentFormData = formData;
    
    if (!validateFormData(formData)) return;
    
    showLoadingSection();
    updateStepIndicator(2);
    
    try {
        const strategy = await generateStrategy(formData);
        generatedStrategy = strategy;
        displayResults(strategy, formData);
        updateStepIndicator(3);
    } catch (error) {
        console.error('戦略生成エラー:', error);
        const dummyStrategy = generateDummyStrategy(formData);
        generatedStrategy = dummyStrategy;
        displayResults(dummyStrategy, formData);
        updateStepIndicator(3);
        showToast('デモモードで表示しています', 'warning');
    }
}

function collectFormData() {
    return {
        businessType: document.querySelector('input[name="businessType"]:checked')?.value || 'B2B',
        business: document.getElementById('business').value.trim(),
        product: document.getElementById('product').value.trim(),
        goal: document.getElementById('goal').value,
        goalLabel: GOAL_LABELS[document.getElementById('goal').value] || '',
        goalValue: document.getElementById('goalValue').value.trim(),
        budget: document.getElementById('budget').value,
        period: document.getElementById('period').value,
        persona: document.getElementById('persona').value.trim(),
        competitors: document.getElementById('competitors').value.trim(),
        currentChannels: document.getElementById('currentChannels').value.trim(),
        challenges: document.getElementById('challenges').value.trim()
    };
}

function validateFormData(data) {
    const required = ['business', 'product', 'goal', 'goalValue', 'budget', 'period', 'persona'];
    for (const field of required) {
        if (!data[field]) {
            showToast('必須項目を入力してください', 'error');
            document.getElementById(field)?.focus();
            return false;
        }
    }
    return true;
}

async function generateStrategy(formData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'API error');
    }
    
    return await response.json();
}

function showLoadingSection() {
    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('loading-section').classList.remove('hidden');
    startProgressAnimation();
}

function startProgressAnimation() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const steps = ['step-analysis', 'step-strategy', 'step-tactics', 'step-roadmap'];
    
    let progress = 0;
    let currentStep = 0;
    
    progressInterval = setInterval(() => {
        progress += 0.5;
        if (progress < 95) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = Math.floor(progress);
            
            const newStep = Math.floor(progress / 25);
            if (newStep > currentStep && newStep < steps.length) {
                document.getElementById(steps[currentStep])?.classList.remove('active');
                document.getElementById(steps[currentStep])?.classList.add('completed');
                document.getElementById(steps[newStep])?.classList.add('active');
                currentStep = newStep;
            }
        }
    }, 100);
}

function completeProgress() {
    if (progressInterval) clearInterval(progressInterval);
    document.getElementById('progress-bar').style.width = '100%';
    document.getElementById('progress-text').textContent = '100';
    ['step-analysis', 'step-strategy', 'step-tactics', 'step-roadmap'].forEach(stepId => {
        document.getElementById(stepId)?.classList.remove('active');
        document.getElementById(stepId)?.classList.add('completed');
    });
}

function displayResults(strategy, formData) {
    completeProgress();
    
    setTimeout(() => {
        document.getElementById('loading-section').classList.add('hidden');
        document.getElementById('result-section').classList.remove('hidden');
        
        // 日付設定
        const now = new Date();
        document.getElementById('generated-date').textContent = now.toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        // サマリーダッシュボード更新
        if (strategy.summary) {
            document.getElementById('summary-goal').textContent = strategy.summary.goal || formData.goalValue;
            document.getElementById('summary-budget').textContent = strategy.summary.budget || formData.budget;
            document.getElementById('summary-period').textContent = strategy.summary.period || formData.period;
            document.getElementById('summary-roi').textContent = strategy.summary.expectedRoi || '200-300%';
        } else {
            document.getElementById('summary-goal').textContent = formData.goalValue;
            document.getElementById('summary-budget').textContent = formData.budget;
            document.getElementById('summary-period').textContent = formData.period;
            document.getElementById('summary-roi').textContent = '200-300%';
        }
        
        // グラフ描画
        if (strategy.chartData) {
            renderCharts(strategy.chartData);
        } else {
            renderCharts(generateDefaultChartData());
        }
        
        // コンテンツ設定
        document.getElementById('overview-content').innerHTML = strategy.overview || '';
        document.getElementById('kpi-content').innerHTML = strategy.kpi || '';
        document.getElementById('budget-content').innerHTML = strategy.budgetDetail || strategy.budget_detail || generateBudgetContent(formData);
        document.getElementById('ads-content').innerHTML = strategy.adsStrategy || strategy.ads_strategy || generateAdsContent(formData);
        document.getElementById('growth-content').innerHTML = strategy.growth || '';
        document.getElementById('tactics-content').innerHTML = strategy.tactics || '';
        document.getElementById('tasks-content').innerHTML = strategy.tasks || '';
        document.getElementById('priority-content').innerHTML = strategy.priority || '';
        document.getElementById('roadmap-content').innerHTML = strategy.roadmap || '';
        document.getElementById('forecast-content').innerHTML = strategy.forecast || '';
        
        document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

// グラフ描画
function renderCharts(chartData) {
    // 既存のグラフを破棄
    Object.values(charts).forEach(chart => chart?.destroy());
    charts = {};
    
    // カラーパレット
    const colors = {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        palette: ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4']
    };
    
    // 予算配分円グラフ
    const budgetCtx = document.getElementById('budgetChart')?.getContext('2d');
    if (budgetCtx && chartData.budgetAllocation) {
        charts.budget = new Chart(budgetCtx, {
            type: 'doughnut',
            data: {
                labels: chartData.budgetAllocation.labels,
                datasets: [{
                    data: chartData.budgetAllocation.values,
                    backgroundColor: colors.palette.slice(0, chartData.budgetAllocation.labels.length),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { font: { size: 11 }, padding: 15 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const amounts = chartData.budgetAllocation.amounts;
                                return `${ctx.label}: ${ctx.parsed}% (${amounts[ctx.dataIndex]})`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // KPI推移線グラフ
    const kpiCtx = document.getElementById('kpiChart')?.getContext('2d');
    if (kpiCtx && chartData.monthlyKpi) {
        charts.kpi = new Chart(kpiCtx, {
            type: 'line',
            data: {
                labels: chartData.monthlyKpi.labels,
                datasets: [
                    {
                        label: 'リード数',
                        data: chartData.monthlyKpi.leads,
                        borderColor: colors.primary,
                        backgroundColor: `${colors.primary}20`,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'サイト訪問数',
                        data: chartData.monthlyKpi.traffic,
                        borderColor: colors.success,
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'リード数' }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: '訪問数' },
                        grid: { drawOnChartArea: false }
                    }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }
    
    // チャネル別効果棒グラフ
    const channelCtx = document.getElementById('channelChart')?.getContext('2d');
    if (channelCtx && chartData.channelEffectiveness) {
        charts.channel = new Chart(channelCtx, {
            type: 'bar',
            data: {
                labels: chartData.channelEffectiveness.labels,
                datasets: [
                    {
                        label: '期待効果スコア',
                        data: chartData.channelEffectiveness.impact,
                        backgroundColor: colors.primary,
                        borderRadius: 6
                    },
                    {
                        label: 'コスト比率(%)',
                        data: chartData.channelEffectiveness.cost,
                        backgroundColor: colors.warning,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }
    
    // ROI推移グラフ
    const roiCtx = document.getElementById('roiChart')?.getContext('2d');
    if (roiCtx && chartData.monthlyRoi) {
        charts.roi = new Chart(roiCtx, {
            type: 'bar',
            data: {
                labels: chartData.monthlyRoi.labels,
                datasets: [
                    {
                        label: '投資額',
                        data: chartData.monthlyRoi.investment,
                        backgroundColor: colors.error + '80',
                        borderRadius: 6
                    },
                    {
                        label: 'リターン',
                        data: chartData.monthlyRoi.return,
                        backgroundColor: colors.success,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: '金額(万円)' } }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }
}

function generateDefaultChartData() {
    return {
        budgetAllocation: {
            labels: ['Google広告', 'SNS広告', 'コンテンツ制作', 'SEO対策', 'その他'],
            values: [35, 25, 20, 15, 5],
            amounts: ['35%', '25%', '20%', '15%', '5%']
        },
        monthlyKpi: {
            labels: ['1ヶ月目', '2ヶ月目', '3ヶ月目', '4ヶ月目', '5ヶ月目', '6ヶ月目'],
            leads: [20, 40, 65, 90, 120, 150],
            traffic: [3000, 5000, 7500, 10000, 13000, 16000]
        },
        channelEffectiveness: {
            labels: ['Google検索', 'ディスプレイ', 'Facebook', 'Instagram', 'SEO', 'メール'],
            impact: [85, 55, 70, 65, 80, 60],
            cost: [30, 15, 20, 15, 10, 10]
        },
        monthlyRoi: {
            labels: ['1ヶ月目', '2ヶ月目', '3ヶ月目', '4ヶ月目', '5ヶ月目', '6ヶ月目'],
            investment: [100, 100, 100, 100, 100, 100],
            return: [40, 80, 140, 200, 280, 380]
        }
    };
}

function generateBudgetContent(formData) {
    return `
        <h4>推奨予算配分</h4>
        <div class="budget-breakdown">
            <div class="budget-bar">
                <div class="budget-segment" style="width: 35%; background: #6366f1;">35%</div>
                <div class="budget-segment" style="width: 25%; background: #8b5cf6;">25%</div>
                <div class="budget-segment" style="width: 20%; background: #a855f7;">20%</div>
                <div class="budget-segment" style="width: 15%; background: #ec4899;">15%</div>
                <div class="budget-segment" style="width: 5%; background: #f43f5e;">5%</div>
            </div>
            <div class="budget-legend">
                <div class="legend-item"><span class="legend-color" style="background: #6366f1;"></span>Google広告 35%</div>
                <div class="legend-item"><span class="legend-color" style="background: #8b5cf6;"></span>SNS広告 25%</div>
                <div class="legend-item"><span class="legend-color" style="background: #a855f7;"></span>コンテンツ 20%</div>
                <div class="legend-item"><span class="legend-color" style="background: #ec4899;"></span>SEO 15%</div>
                <div class="legend-item"><span class="legend-color" style="background: #f43f5e;"></span>その他 5%</div>
            </div>
        </div>
        <table>
            <tr><th>項目</th><th>配分比率</th><th>月額目安</th><th>用途</th></tr>
            <tr><td>Google広告</td><td>35%</td><td>予算の35%</td><td>検索広告、ディスプレイ広告</td></tr>
            <tr><td>SNS広告</td><td>25%</td><td>予算の25%</td><td>Meta広告、LinkedIn広告</td></tr>
            <tr><td>コンテンツ制作</td><td>20%</td><td>予算の20%</td><td>記事、動画、LP制作</td></tr>
            <tr><td>SEO対策</td><td>15%</td><td>予算の15%</td><td>技術SEO、コンテンツSEO</td></tr>
            <tr><td>その他</td><td>5%</td><td>予算の5%</td><td>ツール、予備費</td></tr>
        </table>
    `;
}

function generateAdsContent(formData) {
    const isB2B = formData.businessType === 'B2B';
    return `
        <h4>広告プラットフォーム別戦略</h4>
        <div class="ad-platforms-grid">
            <div class="ad-platform-card">
                <h5><span class="platform-icon google"><i class="fab fa-google"></i></span>Google広告</h5>
                <div class="stat"><span class="stat-label">推奨予算</span><span class="stat-value">予算の35%</span></div>
                <div class="stat"><span class="stat-label">目標CPC</span><span class="stat-value">¥150-300</span></div>
                <div class="stat"><span class="stat-label">想定CTR</span><span class="stat-value">3-5%</span></div>
            </div>
            <div class="ad-platform-card">
                <h5><span class="platform-icon meta"><i class="fab fa-facebook"></i></span>Meta広告</h5>
                <div class="stat"><span class="stat-label">推奨予算</span><span class="stat-value">予算の15%</span></div>
                <div class="stat"><span class="stat-label">目標CPC</span><span class="stat-value">¥80-150</span></div>
                <div class="stat"><span class="stat-label">想定CTR</span><span class="stat-value">1-2%</span></div>
            </div>
            ${isB2B ? `
            <div class="ad-platform-card">
                <h5><span class="platform-icon linkedin"><i class="fab fa-linkedin"></i></span>LinkedIn広告</h5>
                <div class="stat"><span class="stat-label">推奨予算</span><span class="stat-value">予算の10%</span></div>
                <div class="stat"><span class="stat-label">目標CPC</span><span class="stat-value">¥500-800</span></div>
                <div class="stat"><span class="stat-label">想定CTR</span><span class="stat-value">0.5-1%</span></div>
            </div>
            ` : `
            <div class="ad-platform-card">
                <h5><span class="platform-icon twitter"><i class="fab fa-instagram"></i></span>Instagram広告</h5>
                <div class="stat"><span class="stat-label">推奨予算</span><span class="stat-value">予算の10%</span></div>
                <div class="stat"><span class="stat-label">目標CPC</span><span class="stat-value">¥50-100</span></div>
                <div class="stat"><span class="stat-label">想定CTR</span><span class="stat-value">0.8-1.5%</span></div>
            </div>
            `}
        </div>
        <h4>出稿スケジュール</h4>
        <table>
            <tr><th>フェーズ</th><th>期間</th><th>施策</th><th>目的</th></tr>
            <tr><td>テスト期</td><td>1-2週目</td><td>少額で複数クリエイティブテスト</td><td>勝ちパターン発見</td></tr>
            <tr><td>最適化期</td><td>3-4週目</td><td>効果の高いものに予算集中</td><td>CPA改善</td></tr>
            <tr><td>スケール期</td><td>5週目以降</td><td>予算拡大、新規チャネル追加</td><td>リーチ拡大</td></tr>
        </table>
    `;
}

function generateDummyStrategy(formData) {
    return {
        summary: {
            goal: `${formData.goalLabel}: ${formData.goalValue}`,
            budget: formData.budget,
            period: formData.period,
            expectedRoi: '200-300%'
        },
        chartData: generateDefaultChartData(),
        overview: `<h4>戦略コンセプト</h4><p>${formData.business}における${formData.businessType}マーケティング戦略です。</p>`,
        kpi: `<h4>KGI</h4><p>${formData.goalLabel}: ${formData.goalValue}</p>`,
        budgetDetail: generateBudgetContent(formData),
        adsStrategy: generateAdsContent(formData),
        growth: `<h4>成長戦略</h4><p>AARRRフレームワークに基づく成長戦略を展開します。</p>`,
        tactics: `<h4>施策一覧</h4><p>複合的なマーケティング施策を展開します。</p>`,
        tasks: `<h4>週次タスク</h4><p>段階的にタスクを実行します。</p>`,
        priority: `<h4>優先順位</h4><p>Impact/Effortマトリクスに基づき優先順位を設定します。</p>`,
        roadmap: `<h4>ロードマップ</h4><p>${formData.period}の実行計画です。</p>`,
        forecast: `<h4>KPI予測</h4><p>目標達成に向けた推移予測です。</p>`
    };
}

function updateStepIndicator(activeStep) {
    const steps = document.querySelectorAll('.step');
    const lines = document.querySelectorAll('.step-line');
    
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        if (stepNum < activeStep) step.classList.add('completed');
        else if (stepNum === activeStep) step.classList.add('active');
    });
    
    lines.forEach((line, index) => {
        line.classList.toggle('active', index < activeStep - 1);
    });
}

function handleRegenerate() {
    if (!currentFormData) return;
    document.getElementById('result-section').classList.add('hidden');
    showLoadingSection();
    updateStepIndicator(2);
    
    generateStrategy(currentFormData)
        .then(strategy => {
            generatedStrategy = strategy;
            displayResults(strategy, currentFormData);
            updateStepIndicator(3);
        })
        .catch(() => {
            const dummyStrategy = generateDummyStrategy(currentFormData);
            generatedStrategy = dummyStrategy;
            displayResults(dummyStrategy, currentFormData);
            updateStepIndicator(3);
        });
}

function handleEdit() {
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('loading-section').classList.add('hidden');
    document.getElementById('input-section').classList.remove('hidden');
    updateStepIndicator(1);
    document.getElementById('input-section').scrollIntoView({ behavior: 'smooth' });
}

function setupCardToggles() {
    document.querySelectorAll('.result-card .card-header').forEach(header => {
        header.addEventListener('click', () => {
            const body = header.nextElementSibling;
            const icon = header.querySelector('.toggle-btn i');
            body.classList.toggle('collapsed');
            icon.classList.toggle('fa-chevron-up');
            icon.classList.toggle('fa-chevron-down');
        });
    });
}

function exportMarkdown() {
    if (!generatedStrategy || !currentFormData) {
        showToast('エクスポートするデータがありません', 'error');
        return;
    }
    
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-strategy-${formatDate(new Date())}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Markdownファイルをダウンロードしました');
    updateStepIndicator(4);
}

function generateMarkdown() {
    const formData = currentFormData;
    const strategy = generatedStrategy;
    
    const htmlToMarkdown = (html) => {
        if (!html) return '';
        return html
            .replace(/<h4>(.*?)<\/h4>/g, '\n### $1\n')
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
            .replace(/<ul>/g, '\n').replace(/<\/ul>/g, '\n')
            .replace(/<li>/g, '- ').replace(/<\/li>/g, '\n')
            .replace(/<p>(.*?)<\/p>/g, '\n$1\n')
            .replace(/<[^>]*>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };
    
    return `# マーケティング戦略レポート

**生成日**: ${new Date().toLocaleDateString('ja-JP')}

## 基本情報
- **目標**: ${formData.goalLabel}（${formData.goalValue}）
- **予算**: ${formData.budget}
- **期間**: ${formData.period}

## 戦略概要
${htmlToMarkdown(strategy.overview)}

## KPI/KGI
${htmlToMarkdown(strategy.kpi)}

## 予算配分
${htmlToMarkdown(strategy.budgetDetail)}

## 広告戦略
${htmlToMarkdown(strategy.adsStrategy)}

---
*Marketing Strategy Makerにより自動生成*
`;
}

async function copyToClipboard() {
    if (!generatedStrategy || !currentFormData) {
        showToast('コピーするデータがありません', 'error');
        return;
    }
    try {
        await navigator.clipboard.writeText(generateMarkdown());
        showToast('クリップボードにコピーしました');
        updateStepIndicator(4);
    } catch (error) {
        showToast('コピーに失敗しました', 'error');
    }
}

function formatDate(date) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    icon.className = 'fas';
    
    const iconMap = {
        success: { icon: 'fa-check-circle', color: 'var(--success)' },
        error: { icon: 'fa-exclamation-circle', color: 'var(--error)' },
        warning: { icon: 'fa-exclamation-triangle', color: 'var(--warning)' },
        info: { icon: 'fa-info-circle', color: 'var(--info)' }
    };
    
    const config = iconMap[type] || iconMap.success;
    icon.classList.add(config.icon);
    icon.style.color = config.color;
    
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}
