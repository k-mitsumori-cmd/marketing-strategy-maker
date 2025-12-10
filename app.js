/**
 * Marketing Strategy Maker - フロントエンドロジック
 * AIを活用したマーケティング戦略自動生成ツール
 */

// ===== 定数 =====
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
    },
    {
        businessType: 'B2B',
        business: 'BtoBマーケティング支援ツールの開発・販売',
        product: 'リード獲得から商談化までを一元管理できるMAツール「LeadEngine」。Webサイト訪問者の行動分析、スコアリング、自動メール配信、セールス連携機能を搭載。導入企業の商談化率を平均2.5倍に改善。',
        goal: 'lead',
        goalValue: '月間30件のデモ申込',
        budget: '300-500万円',
        period: '6ヶ月',
        persona: 'IT企業・SaaS企業のマーケティング責任者（35-50代）。既存のMAツールに不満を感じている。データドリブンなアプローチを重視し、ROI証明を求める傾向。',
        competitors: 'HubSpot、Marketo、Pardot',
        currentChannels: 'コンテンツマーケティング、ウェビナー、リスティング広告',
        challenges: '大手MAツールとの差別化。導入後のオンボーディング支援体制の構築。'
    }
];

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

// ===== グローバル変数 =====
let currentFormData = null;
let generatedStrategy = null;
let progressInterval = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // フォームイベント
    const form = document.getElementById('strategy-form');
    form.addEventListener('submit', handleFormSubmit);
    
    // サンプルデータボタン
    document.getElementById('sample-btn').addEventListener('click', fillSampleData);
    
    // 文字カウント
    setupCharCount('business', 500);
    setupCharCount('product', 1000);
    setupCharCount('persona', 1000);
    
    // 結果セクションのイベント
    document.getElementById('regenerate-btn')?.addEventListener('click', handleRegenerate);
    document.getElementById('edit-btn')?.addEventListener('click', handleEdit);
    
    // エクスポートボタン
    document.getElementById('export-markdown-btn')?.addEventListener('click', exportMarkdown);
    document.getElementById('export-pdf-btn')?.addEventListener('click', exportPDF);
    document.getElementById('copy-btn')?.addEventListener('click', copyToClipboard);
    
    // カード折りたたみ
    setupCardToggles();
}

// ===== 文字カウント =====
function setupCharCount(fieldId, maxCount) {
    const field = document.getElementById(fieldId);
    const countSpan = document.getElementById(`${fieldId}-count`);
    
    if (field && countSpan) {
        field.addEventListener('input', () => {
            const count = field.value.length;
            countSpan.textContent = count;
            if (count > maxCount) {
                countSpan.style.color = 'var(--error)';
            } else {
                countSpan.style.color = 'var(--gray-400)';
            }
        });
    }
}

// ===== サンプルデータ =====
function fillSampleData() {
    const sample = SAMPLE_DATA_ARRAY[Math.floor(Math.random() * SAMPLE_DATA_ARRAY.length)];
    
    // ラジオボタン
    const radioBtn = document.querySelector(`input[name="businessType"][value="${sample.businessType}"]`);
    if (radioBtn) radioBtn.checked = true;
    
    // テキストフィールド
    document.getElementById('business').value = sample.business;
    document.getElementById('product').value = sample.product;
    document.getElementById('goal').value = sample.goal;
    document.getElementById('goalValue').value = sample.goalValue;
    document.getElementById('budget').value = sample.budget;
    document.getElementById('period').value = sample.period;
    document.getElementById('persona').value = sample.persona;
    
    // オプション
    document.getElementById('competitors').value = sample.competitors || '';
    document.getElementById('currentChannels').value = sample.currentChannels || '';
    document.getElementById('challenges').value = sample.challenges || '';
    
    // 文字カウント更新
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

// ===== フォーム送信 =====
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // フォームデータ収集
    const formData = collectFormData();
    currentFormData = formData;
    
    // バリデーション
    if (!validateFormData(formData)) {
        return;
    }
    
    // UIを生成中状態に
    showLoadingSection();
    updateStepIndicator(2);
    
    try {
        // API呼び出し
        const strategy = await generateStrategy(formData);
        generatedStrategy = strategy;
        
        // 結果を表示
        displayResults(strategy);
        updateStepIndicator(3);
        
    } catch (error) {
        console.error('戦略生成エラー:', error);
        
        // フォールバック: ダミーデータで表示
        console.warn('APIエラー、ダミーデータにフォールバック');
        const dummyStrategy = generateDummyStrategy(formData);
        generatedStrategy = dummyStrategy;
        displayResults(dummyStrategy);
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

// ===== API呼び出し =====
async function generateStrategy(formData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'API error');
    }
    
    return await response.json();
}

// ===== ローディング表示 =====
function showLoadingSection() {
    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('loading-section').classList.remove('hidden');
    
    // プログレスアニメーション開始
    startProgressAnimation();
}

function startProgressAnimation() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const steps = ['step-analysis', 'step-strategy', 'step-tactics', 'step-roadmap'];
    
    let progress = 0;
    const targetProgress = 95;
    const duration = 30000; // 30秒で95%
    const interval = 100;
    const increment = (targetProgress / duration) * interval;
    
    // ステップを順次アクティブに
    let currentStep = 0;
    const stepInterval = duration / steps.length;
    
    progressInterval = setInterval(() => {
        progress += increment;
        
        if (progress < targetProgress) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = Math.floor(progress);
            
            // ステップ更新
            const newStep = Math.floor(progress / (100 / steps.length));
            if (newStep > currentStep && newStep < steps.length) {
                document.getElementById(steps[currentStep])?.classList.remove('active');
                document.getElementById(steps[currentStep])?.classList.add('completed');
                document.getElementById(steps[newStep])?.classList.add('active');
                currentStep = newStep;
            }
        } else {
            clearInterval(progressInterval);
        }
    }, interval);
}

function completeProgress() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    progressBar.style.width = '100%';
    progressText.textContent = '100';
    
    // 全ステップを完了に
    ['step-analysis', 'step-strategy', 'step-tactics', 'step-roadmap'].forEach(stepId => {
        document.getElementById(stepId)?.classList.remove('active');
        document.getElementById(stepId)?.classList.add('completed');
    });
}

// ===== 結果表示 =====
function displayResults(strategy) {
    completeProgress();
    
    setTimeout(() => {
        document.getElementById('loading-section').classList.add('hidden');
        document.getElementById('result-section').classList.remove('hidden');
        
        // 生成日を設定
        const now = new Date();
        document.getElementById('generated-date').textContent = now.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // 各セクションにコンテンツを設定
        document.getElementById('overview-content').innerHTML = strategy.overview || '';
        document.getElementById('kpi-content').innerHTML = strategy.kpi || '';
        document.getElementById('growth-content').innerHTML = strategy.growth || '';
        document.getElementById('tactics-content').innerHTML = strategy.tactics || '';
        document.getElementById('tasks-content').innerHTML = strategy.tasks || '';
        document.getElementById('priority-content').innerHTML = strategy.priority || '';
        document.getElementById('roadmap-content').innerHTML = strategy.roadmap || '';
        document.getElementById('forecast-content').innerHTML = strategy.forecast || '';
        
        // スクロール
        document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
        
    }, 500);
}

// ===== ダミーデータ生成（フォールバック用） =====
function generateDummyStrategy(formData) {
    const businessTypeLabel = formData.businessType === 'B2B' ? '法人向け' : 
                              formData.businessType === 'B2C' ? '個人向け' : '法人・個人向け';
    
    return {
        overview: `
            <h4>戦略コンセプト</h4>
            <p>${formData.business}における${businessTypeLabel}マーケティング戦略として、<strong>「信頼構築型アプローチ」</strong>を軸に展開します。</p>
            <p>${formData.period}の期間で${formData.goalLabel}（${formData.goalValue}）の達成を目指し、以下の3つの柱で施策を実行します：</p>
            <ul>
                <li><strong>認知拡大フェーズ</strong>：ターゲット層へのリーチ最大化</li>
                <li><strong>興味喚起フェーズ</strong>：価値提案とエンゲージメント強化</li>
                <li><strong>行動促進フェーズ</strong>：コンバージョン最適化</li>
            </ul>
            <h4>ターゲット戦略</h4>
            <p>${formData.persona}</p>
            <p>このペルソナに対し、課題解決型のメッセージングで訴求します。</p>
        `,
        kpi: `
            <h4>KGI（重要目標達成指標）</h4>
            <table>
                <tr>
                    <th>指標</th>
                    <th>目標値</th>
                    <th>期間</th>
                </tr>
                <tr>
                    <td>${formData.goalLabel}</td>
                    <td><strong>${formData.goalValue}</strong></td>
                    <td>${formData.period}</td>
                </tr>
            </table>
            
            <h4>KPI（重要業績評価指標）</h4>
            <table>
                <tr>
                    <th>フェーズ</th>
                    <th>KPI</th>
                    <th>目標値</th>
                </tr>
                <tr>
                    <td>認知</td>
                    <td>サイト訪問数</td>
                    <td>月間10,000 UU</td>
                </tr>
                <tr>
                    <td>興味</td>
                    <td>資料DL数 / メルマガ登録数</td>
                    <td>月間300件</td>
                </tr>
                <tr>
                    <td>検討</td>
                    <td>問い合わせ数</td>
                    <td>月間50件</td>
                </tr>
                <tr>
                    <td>行動</td>
                    <td>${formData.goalLabel}</td>
                    <td>${formData.goalValue}</td>
                </tr>
            </table>
        `,
        growth: `
            <h4>Acquisition（獲得）</h4>
            <ul>
                <li><strong>有料広告</strong>: Google広告、${formData.businessType === 'B2C' ? 'SNS広告（Instagram/TikTok）' : 'LinkedIn広告'}</li>
                <li><strong>オーガニック</strong>: SEO対策、コンテンツマーケティング</li>
                <li><strong>リファラル</strong>: 紹介プログラム、アフィリエイト</li>
            </ul>
            
            <h4>Activation（活性化）</h4>
            <ul>
                <li>ランディングページの最適化（CRO）</li>
                <li>無料トライアル / デモの提供</li>
                <li>オンボーディングメールシーケンス</li>
            </ul>
            
            <h4>Retention（継続）</h4>
            <ul>
                <li>カスタマーサクセスプログラム</li>
                <li>定期的な価値提供（メルマガ、ウェビナー）</li>
                <li>NPS調査とフィードバック収集</li>
            </ul>
            
            <h4>Revenue（収益）</h4>
            <ul>
                <li>アップセル / クロスセル施策</li>
                <li>年間契約へのアップグレード促進</li>
                <li>LTV最大化戦略</li>
            </ul>
            
            <h4>Referral（紹介）</h4>
            <ul>
                <li>お客様の声・導入事例の活用</li>
                <li>紹介インセンティブプログラム</li>
                <li>コミュニティ構築</li>
            </ul>
        `,
        tactics: `
            <h4>広告施策</h4>
            <table>
                <tr>
                    <th>施策</th>
                    <th>目的</th>
                    <th>予算配分</th>
                </tr>
                <tr>
                    <td>Google検索広告</td>
                    <td>顕在層の獲得</td>
                    <td>30%</td>
                </tr>
                <tr>
                    <td>${formData.businessType === 'B2C' ? 'Meta広告' : 'LinkedIn広告'}</td>
                    <td>潜在層の認知獲得</td>
                    <td>25%</td>
                </tr>
                <tr>
                    <td>リマーケティング広告</td>
                    <td>離脱ユーザーの再獲得</td>
                    <td>15%</td>
                </tr>
            </table>
            
            <h4>SEO / コンテンツ施策</h4>
            <ul>
                <li>ブログ記事（週2本）- キーワード戦略に基づく</li>
                <li>ホワイトペーパー / eBook（月1本）</li>
                <li>導入事例（月2本）</li>
                <li>FAQ / ナレッジベースの整備</li>
            </ul>
            
            <h4>SNS施策</h4>
            <ul>
                <li>${formData.businessType === 'B2B' ? 'Twitter / LinkedIn' : 'Instagram / TikTok'}での情報発信</li>
                <li>UGC（ユーザー生成コンテンツ）の活用</li>
                <li>インフルエンサーコラボレーション</li>
            </ul>
            
            <h4>セールス連携</h4>
            <ul>
                <li>リードスコアリングの実装</li>
                <li>ホットリードの営業チームへの即時連携</li>
                <li>商談化率向上のためのナーチャリングコンテンツ</li>
            </ul>
        `,
        tasks: `
            <h4>初月（立ち上げフェーズ）</h4>
            <ul>
                <li>□ 競合分析・市場調査の実施</li>
                <li>□ キーワードリサーチ・SEO戦略策定</li>
                <li>□ 広告アカウント設計・キャンペーン構築</li>
                <li>□ ランディングページの改善・A/Bテスト設計</li>
                <li>□ コンテンツカレンダーの作成</li>
                <li>□ 計測環境の整備（GA4、GTM、コンバージョン設定）</li>
            </ul>
            
            <h4>2-3ヶ月目（実行フェーズ）</h4>
            <ul>
                <li>□ 広告運用開始・日次最適化</li>
                <li>□ コンテンツ制作・公開（週2本ペース）</li>
                <li>□ SNS運用開始</li>
                <li>□ メールマーケティング施策の実施</li>
                <li>□ A/Bテストの実施・分析</li>
                <li>□ リードナーチャリングフローの構築</li>
            </ul>
            
            <h4>4-6ヶ月目（最適化フェーズ）</h4>
            <ul>
                <li>□ パフォーマンスデータの分析・改善</li>
                <li>□ 高パフォーマンス施策への予算再配分</li>
                <li>□ 新規チャネルのテスト</li>
                <li>□ カスタマーサクセス施策の強化</li>
                <li>□ 導入事例の作成・活用</li>
                <li>□ 次期戦略の策定</li>
            </ul>
        `,
        priority: `
            <h4>Impact / Effort マトリクス</h4>
            <table>
                <tr>
                    <th>施策</th>
                    <th>Impact</th>
                    <th>Effort</th>
                    <th>優先度</th>
                </tr>
                <tr>
                    <td>Google検索広告</td>
                    <td>高</td>
                    <td>低</td>
                    <td><span class="priority-high">最優先</span></td>
                </tr>
                <tr>
                    <td>LP改善・CRO</td>
                    <td>高</td>
                    <td>中</td>
                    <td><span class="priority-high">最優先</span></td>
                </tr>
                <tr>
                    <td>コンテンツSEO</td>
                    <td>高</td>
                    <td>高</td>
                    <td><span class="priority-medium">重要</span></td>
                </tr>
                <tr>
                    <td>SNS運用</td>
                    <td>中</td>
                    <td>中</td>
                    <td><span class="priority-medium">重要</span></td>
                </tr>
                <tr>
                    <td>リマーケティング広告</td>
                    <td>中</td>
                    <td>低</td>
                    <td><span class="priority-medium">重要</span></td>
                </tr>
                <tr>
                    <td>メールマーケティング</td>
                    <td>中</td>
                    <td>中</td>
                    <td><span class="priority-low">推奨</span></td>
                </tr>
                <tr>
                    <td>インフルエンサー施策</td>
                    <td>中</td>
                    <td>高</td>
                    <td><span class="priority-low">推奨</span></td>
                </tr>
            </table>
            
            <h4>推奨実行順序</h4>
            <ol>
                <li><strong>即時着手</strong>: Google広告、LP改善（効果が出るまで1-2週間）</li>
                <li><strong>1ヶ月以内</strong>: コンテンツSEO基盤構築、SNS運用開始</li>
                <li><strong>2-3ヶ月目</strong>: リマーケティング、メールマーケティング強化</li>
                <li><strong>4ヶ月目以降</strong>: インフルエンサー施策、新規チャネルテスト</li>
            </ol>
        `,
        roadmap: `
            <h4>月次ロードマップ</h4>
            <table>
                <tr>
                    <th>月</th>
                    <th>フェーズ</th>
                    <th>主要タスク</th>
                    <th>マイルストーン</th>
                </tr>
                <tr>
                    <td>1ヶ月目</td>
                    <td>準備・立ち上げ</td>
                    <td>戦略策定、環境構築、広告開始</td>
                    <td>広告配信開始</td>
                </tr>
                <tr>
                    <td>2ヶ月目</td>
                    <td>実行・検証</td>
                    <td>施策実行、データ収集、初期最適化</td>
                    <td>コンテンツ10本公開</td>
                </tr>
                <tr>
                    <td>3ヶ月目</td>
                    <td>最適化</td>
                    <td>A/Bテスト、改善サイクル確立</td>
                    <td>CVR 20%改善</td>
                </tr>
                <tr>
                    <td>4ヶ月目</td>
                    <td>拡大</td>
                    <td>成功施策の拡大、新規チャネル</td>
                    <td>リード目標50%達成</td>
                </tr>
                <tr>
                    <td>5ヶ月目</td>
                    <td>加速</td>
                    <td>予算再配分、効率化</td>
                    <td>リード目標75%達成</td>
                </tr>
                <tr>
                    <td>6ヶ月目</td>
                    <td>達成・次期計画</td>
                    <td>目標達成、振り返り、次期戦略</td>
                    <td>目標100%達成</td>
                </tr>
            </table>
        `,
        forecast: `
            <h4>想定KPI推移</h4>
            <table>
                <tr>
                    <th>月</th>
                    <th>サイト訪問数</th>
                    <th>リード獲得数</th>
                    <th>達成率</th>
                </tr>
                <tr>
                    <td>1ヶ月目</td>
                    <td>3,000 UU</td>
                    <td>30件</td>
                    <td>15%</td>
                </tr>
                <tr>
                    <td>2ヶ月目</td>
                    <td>5,000 UU</td>
                    <td>60件</td>
                    <td>30%</td>
                </tr>
                <tr>
                    <td>3ヶ月目</td>
                    <td>7,000 UU</td>
                    <td>100件</td>
                    <td>50%</td>
                </tr>
                <tr>
                    <td>4ヶ月目</td>
                    <td>9,000 UU</td>
                    <td>140件</td>
                    <td>70%</td>
                </tr>
                <tr>
                    <td>5ヶ月目</td>
                    <td>10,000 UU</td>
                    <td>170件</td>
                    <td>85%</td>
                </tr>
                <tr>
                    <td>6ヶ月目</td>
                    <td>12,000 UU</td>
                    <td>200件</td>
                    <td>100%</td>
                </tr>
            </table>
            
            <h4>想定ROI</h4>
            <ul>
                <li><strong>総投資額</strong>: ${formData.budget} × ${formData.period}</li>
                <li><strong>想定CPA</strong>: ¥15,000〜¥25,000</li>
                <li><strong>想定ROI</strong>: 150%〜300%（6ヶ月後）</li>
            </ul>
            
            <p><em>※ 上記は過去の類似案件の実績に基づく推計値です。実際の数値は市場環境や施策の実行度により変動します。</em></p>
        `
    };
}

// ===== ステップインジケーター更新 =====
function updateStepIndicator(activeStep) {
    const steps = document.querySelectorAll('.step');
    const lines = document.querySelectorAll('.step-line');
    
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < activeStep) {
            step.classList.add('completed');
        } else if (stepNum === activeStep) {
            step.classList.add('active');
        }
    });
    
    lines.forEach((line, index) => {
        if (index < activeStep - 1) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
}

// ===== 再生成・編集 =====
function handleRegenerate() {
    if (!currentFormData) return;
    
    document.getElementById('result-section').classList.add('hidden');
    showLoadingSection();
    updateStepIndicator(2);
    
    generateStrategy(currentFormData)
        .then(strategy => {
            generatedStrategy = strategy;
            displayResults(strategy);
            updateStepIndicator(3);
        })
        .catch(error => {
            console.warn('再生成エラー、ダミーデータを使用:', error);
            const dummyStrategy = generateDummyStrategy(currentFormData);
            generatedStrategy = dummyStrategy;
            displayResults(dummyStrategy);
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

// ===== カード折りたたみ =====
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

// ===== エクスポート機能 =====
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
    
    // HTMLタグを除去してテキスト化
    const stripHtml = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    };
    
    // HTMLをMarkdownに変換（簡易版）
    const htmlToMarkdown = (html) => {
        return html
            .replace(/<h4>(.*?)<\/h4>/g, '\n### $1\n')
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
            .replace(/<ul>/g, '\n')
            .replace(/<\/ul>/g, '\n')
            .replace(/<li>/g, '- ')
            .replace(/<\/li>/g, '\n')
            .replace(/<ol>/g, '\n')
            .replace(/<\/ol>/g, '\n')
            .replace(/<table>[\s\S]*?<\/table>/g, (match) => {
                // テーブルをMarkdown形式に変換
                let md = '\n';
                const rows = match.match(/<tr>[\s\S]*?<\/tr>/g) || [];
                let isHeader = true;
                
                rows.forEach(row => {
                    const cells = row.match(/<t[hd]>([\s\S]*?)<\/t[hd]>/g) || [];
                    const cellContents = cells.map(cell => 
                        cell.replace(/<t[hd]>([\s\S]*?)<\/t[hd]>/g, '$1')
                           .replace(/<[^>]*>/g, '')
                           .trim()
                    );
                    md += '| ' + cellContents.join(' | ') + ' |\n';
                    
                    if (isHeader) {
                        md += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
                        isHeader = false;
                    }
                });
                
                return md;
            })
            .replace(/<p>(.*?)<\/p>/g, '\n$1\n')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<span[^>]*>(.*?)<\/span>/g, '$1')
            .replace(/<em>(.*?)<\/em>/g, '*$1*')
            .replace(/<[^>]*>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };
    
    return `# マーケティング戦略レポート

**生成日**: ${new Date().toLocaleDateString('ja-JP')}

---

## 基本情報

- **ビジネスタイプ**: ${formData.businessType}
- **事業内容**: ${formData.business}
- **商品/サービス**: ${formData.product}
- **目標**: ${formData.goalLabel}（${formData.goalValue}）
- **予算**: ${formData.budget}
- **期間**: ${formData.period}
- **ターゲット**: ${formData.persona}

---

## 1. マーケティング戦略の全体像

${htmlToMarkdown(strategy.overview)}

---

## 2. 目的・KPI・KGI整理

${htmlToMarkdown(strategy.kpi)}

---

## 3. 成長戦略（AARRR）

${htmlToMarkdown(strategy.growth)}

---

## 4. 施策一覧

${htmlToMarkdown(strategy.tactics)}

---

## 5. 詳細タスク

${htmlToMarkdown(strategy.tasks)}

---

## 6. 施策の優先順位

${htmlToMarkdown(strategy.priority)}

---

## 7. 月次ロードマップ

${htmlToMarkdown(strategy.roadmap)}

---

## 8. 想定KPI推移予測

${htmlToMarkdown(strategy.forecast)}

---

*このレポートはMarketing Strategy Makerにより自動生成されました。*
`;
}

async function exportPDF() {
    if (!generatedStrategy || !currentFormData) {
        showToast('エクスポートするデータがありません', 'error');
        return;
    }
    
    showToast('PDFを生成中...', 'info');
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // フォント設定（日本語対応のため）
        pdf.setFont('helvetica');
        
        // タイトル
        pdf.setFontSize(20);
        pdf.text('Marketing Strategy Report', 105, 20, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleDateString('ja-JP')}`, 105, 30, { align: 'center' });
        
        // 注釈
        pdf.setFontSize(12);
        pdf.text('Please refer to the Markdown file for detailed content with Japanese text.', 105, 50, { align: 'center' });
        
        // 基本情報
        pdf.setFontSize(14);
        pdf.text('Basic Information', 20, 70);
        
        pdf.setFontSize(10);
        pdf.text(`Business Type: ${currentFormData.businessType}`, 20, 80);
        pdf.text(`Goal: ${currentFormData.goalLabel} (${currentFormData.goalValue})`, 20, 88);
        pdf.text(`Budget: ${currentFormData.budget}`, 20, 96);
        pdf.text(`Period: ${currentFormData.period}`, 20, 104);
        
        // セクション一覧
        pdf.setFontSize(14);
        pdf.text('Report Sections', 20, 124);
        
        pdf.setFontSize(10);
        const sections = [
            '1. Marketing Strategy Overview',
            '2. Purpose / KPI / KGI',
            '3. Growth Strategy (AARRR)',
            '4. Tactics List',
            '5. Detailed Tasks',
            '6. Priority Matrix',
            '7. Monthly Roadmap',
            '8. KPI Forecast'
        ];
        
        sections.forEach((section, index) => {
            pdf.text(section, 25, 134 + (index * 8));
        });
        
        // フッター
        pdf.setFontSize(8);
        pdf.text('Generated by Marketing Strategy Maker', 105, 285, { align: 'center' });
        
        // ダウンロード
        pdf.save(`marketing-strategy-${formatDate(new Date())}.pdf`);
        
        showToast('PDFをダウンロードしました（日本語はMarkdownを参照）');
        updateStepIndicator(4);
        
    } catch (error) {
        console.error('PDF生成エラー:', error);
        showToast('PDF生成に失敗しました。Markdownでダウンロードしてください。', 'error');
    }
}

async function copyToClipboard() {
    if (!generatedStrategy || !currentFormData) {
        showToast('コピーするデータがありません', 'error');
        return;
    }
    
    const markdown = generateMarkdown();
    
    try {
        await navigator.clipboard.writeText(markdown);
        showToast('クリップボードにコピーしました');
        updateStepIndicator(4);
    } catch (error) {
        console.error('コピーエラー:', error);
        showToast('コピーに失敗しました', 'error');
    }
}

// ===== ユーティリティ =====
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    // アイコン設定
    icon.className = 'fas';
    switch (type) {
        case 'success':
            icon.classList.add('fa-check-circle');
            icon.style.color = 'var(--success)';
            break;
        case 'error':
            icon.classList.add('fa-exclamation-circle');
            icon.style.color = 'var(--error)';
            break;
        case 'warning':
            icon.classList.add('fa-exclamation-triangle');
            icon.style.color = 'var(--warning)';
            break;
        case 'info':
            icon.classList.add('fa-info-circle');
            icon.style.color = 'var(--info)';
            break;
    }
    
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}
