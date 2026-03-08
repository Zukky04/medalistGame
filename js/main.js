// main.js - メダリスト検定のコアロジック

// === State & Constants ===
let currentDifficulty = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let scoreTES = 0; // 技術点
let scorePCS = 0; // 演技構成点
let correctCount = 0;

let timerInterval;
const TIME_LIMIT = 10; // 1問あたりの制限時間（秒）
let timeLeft = TIME_LIMIT;

// DOM Elements
const screens = {
    title: document.getElementById('title-screen'),
    difficulty: document.getElementById('difficulty-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
};

const dom = {
    diffButtons: document.querySelectorAll('.diff-btn'),
    startBtn: document.getElementById('start-btn'),
    backToTitleBtn: document.getElementById('back-to-title-btn'),

    questionCounter: document.getElementById('question-counter'),
    currentDifficultyBadge: document.getElementById('current-difficulty'),
    timerBar: document.getElementById('timer-bar'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),

    medalImage: document.getElementById('medal-image'),
    rankText: document.getElementById('rank-text'),
    totalScoreText: document.getElementById('total-score-text'),
    tesScoreText: document.getElementById('tes-score-text'),
    pcsScoreText: document.getElementById('pcs-score-text'),
    correctCountText: document.getElementById('correct-count-text'),

    retryBtn: document.getElementById('retry-btn'),
    titleReturnBtn: document.getElementById('title-return-btn')
};

// === Initialization & Event Listeners ===
function init() {
    // Title Screen
    dom.startBtn.addEventListener('click', () => showScreen('difficulty'));

    // Difficulty Screen
    dom.diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // button内の要素がクリックされた場合の対策
            const targetBtn = e.target.closest('.diff-btn');
            startQuiz(targetBtn.dataset.diff);
        });
    });
    dom.backToTitleBtn.addEventListener('click', () => showScreen('title'));

    // Result Screen
    dom.retryBtn.addEventListener('click', () => showScreen('difficulty'));
    dom.titleReturnBtn.addEventListener('click', () => showScreen('title'));

    showScreen('title');
}

// === Navigation ===
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// === Quiz Logic ===
function startQuiz(difficulty) {
    currentDifficulty = difficulty;

    // 質問データをシャッフルして10問抽出（今回はデータがちょうど10問なので全体をシャッフル）
    currentQuestions = [...quizData[difficulty]].sort(() => Math.random() - 0.5);
    // もしデータが増えた場合は以下を有効化
    if (currentQuestions.length > 10) {
        currentQuestions = currentQuestions.slice(0, 10);
    }

    currentQuestionIndex = 0;
    scoreTES = 0;
    scorePCS = 0;
    correctCount = 0;

    // Update UI badge
    const diffNames = { novice: 'ノービス', junior: 'ジュニア', senior: 'シニア' };
    dom.currentDifficultyBadge.textContent = diffNames[difficulty];

    showScreen('quiz');
    loadQuestion();
}

function loadQuestion() {
    const currentQ = currentQuestions[currentQuestionIndex];

    dom.questionCounter.textContent = `Q. ${currentQuestionIndex + 1} / 10`;
    dom.questionText.textContent = currentQ.question;

    // Options render
    dom.optionsContainer.innerHTML = '';
    currentQ.options.forEach((optionText, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn option-btn';
        btn.textContent = optionText;
        btn.onclick = () => handleAnswer(index, btn);
        dom.optionsContainer.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = TIME_LIMIT;
    updateTimerUI();

    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        updateTimerUI();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeLeft = 0;
            handleAnswer(-1, null); // Time out
        }
    }, 100);
}

function updateTimerUI() {
    const percentage = (timeLeft / TIME_LIMIT) * 100;
    dom.timerBar.style.width = `${Math.max(percentage, 0)}%`;

    if (percentage > 50) {
        dom.timerBar.style.backgroundColor = 'var(--timer-color)';
    } else if (percentage > 20) {
        dom.timerBar.style.backgroundColor = 'var(--timer-warning)';
    } else {
        dom.timerBar.style.backgroundColor = 'var(--timer-danger)';
    }
}

function handleAnswer(selectedIndex, selectedBtn) {
    clearInterval(timerInterval); // タイマーストップ

    const currentQ = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQ.answer;
    const optionButtons = dom.optionsContainer.querySelectorAll('button');

    // 全ボタンを無効化
    optionButtons.forEach(btn => btn.disabled = true);

    if (isCorrect) {
        // 正解のスタイル適用
        if (selectedBtn) {
            selectedBtn.classList.add('correct');
            selectedBtn.textContent += '  ⭕️';
        }

        // スコア計算
        scoreTES += 10; // 基本点 (10点 x 10問 = 100点満点)

        // PCS計算 (残り時間に応じて最大5点)
        // 10秒残しなら5点、5秒残しなら2.5点、ギリギリなら0点
        const pcsEarned = (timeLeft / TIME_LIMIT) * 5;
        scorePCS += pcsEarned;

        correctCount++;
    } else {
        // 誤答のスタイル適用
        if (selectedBtn) {
            selectedBtn.classList.add('wrong');
            selectedBtn.textContent += '  ❌';
        }
        // 正解の選択肢をハイライト
        optionButtons[currentQ.answer].classList.add('correct');

        // タイムアウトの場合は追加のフィードバックがあってもよい
        if (selectedIndex === -1) {
            dom.questionText.textContent = "Time Up... " + dom.questionText.textContent;
        }
    }

    // 1秒待って解説表示へ（今回は簡略化のため即次の問題へ移行。余裕があれば間に解説を挟む）
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuestions.length) {
            loadQuestion();
        } else {
            showResult();
        }
    }, 1500);
}

// === Result Processing ===
function showResult() {
    const totalScore = scoreTES + scorePCS;

    dom.totalScoreText.textContent = totalScore.toFixed(2);
    dom.tesScoreText.textContent = scoreTES.toFixed(2);
    dom.pcsScoreText.textContent = scorePCS.toFixed(2);
    dom.correctCountText.textContent = `${correctCount} / 10`;

    // メダル判定
    dom.medalImage.className = 'medal'; // reset

    let rankStr = '';
    if (totalScore >= 130) {
        dom.medalImage.classList.add('gold-medal');
        rankStr = '金メダル獲得！（Sランク）';
    } else if (totalScore >= 100) {
        dom.medalImage.classList.add('silver-medal');
        rankStr = '銀メダル獲得！（Aランク）';
    } else if (totalScore >= 70) {
        dom.medalImage.classList.add('bronze-medal');
        rankStr = '銅メダル獲得！（Bランク）';
    } else {
        dom.medalImage.classList.add('none-medal');
        rankStr = '入賞ならず（Cランク）';
    }

    dom.rankText.textContent = rankStr;

    showScreen('result');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
