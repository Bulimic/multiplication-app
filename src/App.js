import React, { useState, useEffect } from 'react';

const ImprovedMultiplicationApp = () => {
  // 基本的な状態
  const [currentTable, setCurrentTable] = useState(1);
  const [mode, setMode] = useState('learn'); // 'learn', 'quiz', 'flashcard', 'test'
  const [masteredTables, setMasteredTables] = useState({});
  const [streak, setStreak] = useState(0);
  const [showColorCoding, setShowColorCoding] = useState(true);
  
  // クイズモード状態
  const [quizQuestion, setQuizQuestion] = useState({ num1: 1, num2: 1 });
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  
  // フラッシュカードモード状態
  const [flashcardQuestion, setFlashcardQuestion] = useState({ num1: 1, num2: 1 });
  const [showAnswer, setShowAnswer] = useState(false);
  const [knownCards, setKnownCards] = useState([]);
  const [reviewCards, setReviewCards] = useState([]);
  
  // テストモード状態
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testFinished, setTestFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  // データをローカルストレージからロード
  useEffect(() => {
    const savedMastered = localStorage.getItem('masteredTables');
    if (savedMastered) {
      setMasteredTables(JSON.parse(savedMastered));
    }
  }, []);

  // タイマークリーンアップ
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // モードの変更
  const changeMode = (newMode) => {
    setMode(newMode);
    setSelectedAnswer(null);
    setQuizResult(null);
    setShowAnswer(false);
    
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    if (newMode === 'quiz') {
      generateQuizQuestion();
    } else if (newMode === 'flashcard') {
      resetFlashcards();
      generateFlashcardQuestion();
    } else if (newMode === 'test') {
      generateTestQuestions();
      startTimer();
    }
  };

  // 段の変更
  const changeTable = (table) => {
    setCurrentTable(table);
    setSelectedAnswer(null);
    setQuizResult(null);
    setShowAnswer(false);
    
    if (mode === 'quiz') {
      generateQuizQuestion(table);
    } else if (mode === 'flashcard') {
      resetFlashcards(table);
      generateFlashcardQuestion(table);
    }
  };

  // フラッシュカードのリセット
  const resetFlashcards = (table = currentTable) => {
    const cards = [];
    const tablesToUse = table === 0 ? Array.from({ length: 19 }, (_, i) => i + 1) : [table];
    
    tablesToUse.forEach(t => {
      for (let i = 1; i <= 19; i++) {
        cards.push({ num1: t, num2: i });
      }
    });
    
    // カードをシャッフル
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    setKnownCards([]);
    setReviewCards(cards);
  };

  // クイズ問題の生成
  const generateQuizQuestion = (table = currentTable) => {
    let num1, num2;
    
    if (table === 0) {
      // ランダムな掛け算
      num1 = Math.floor(Math.random() * 19) + 1;
      num2 = Math.floor(Math.random() * 19) + 1;
    } else {
      // 特定の段
      num1 = table;
      num2 = Math.floor(Math.random() * 19) + 1;
    }
    
    const correctAnswer = num1 * num2;
    
    // 選択肢を生成
    const options = [correctAnswer];
    
    // 間違った選択肢を生成 (近い数値を含める)
    while (options.length < 4) {
      let wrongAnswer;
      const randomType = Math.floor(Math.random() * 4);
      
      if (randomType === 0) {
        // 近い数の掛け算
        const nearNum1 = Math.max(1, Math.min(19, num1 + (Math.random() < 0.5 ? 1 : -1)));
        const nearNum2 = Math.max(1, Math.min(19, num2 + (Math.random() < 0.5 ? 1 : -1)));
        wrongAnswer = nearNum1 * nearNum2;
      } else if (randomType === 1) {
        // ±10の範囲でランダム
        wrongAnswer = correctAnswer + (Math.floor(Math.random() * 21) - 10);
      } else if (randomType === 2) {
        // 数字の入れ替え (例: 12と21)
        const correctStr = correctAnswer.toString();
        if (correctStr.length > 1) {
          wrongAnswer = parseInt(correctStr.split('').reverse().join(''));
        } else {
          wrongAnswer = correctAnswer + 10;
        }
      } else {
        // 完全ランダム
        wrongAnswer = Math.floor(Math.random() * 400) + 1;
      }
      
      // 重複を避け、正答と異なる値のみ追加
      if (!options.includes(wrongAnswer) && wrongAnswer !== correctAnswer && wrongAnswer > 0) {
        options.push(wrongAnswer);
      }
    }
    
    // 選択肢をシャッフル
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    setQuizQuestion({ num1, num2 });
    setQuizOptions(options);
    setSelectedAnswer(null);
    setQuizResult(null);
  };

  // クイズの回答チェック
  const checkQuizAnswer = (answer) => {
    const correctAnswer = quizQuestion.num1 * quizQuestion.num2;
    const isCorrect = answer === correctAnswer;
    
    setSelectedAnswer(answer);
    setQuizResult(isCorrect);
    
    if (isCorrect) {
      setStreak(prev => prev + 1);
      
      // マスター状態を更新
      const key = `${quizQuestion.num1}x${quizQuestion.num2}`;
      const newMastered = { ...masteredTables, [key]: true };
      setMasteredTables(newMastered);
      localStorage.setItem('masteredTables', JSON.stringify(newMastered));
      
      // 少し待ってから次の問題
      setTimeout(() => {
        generateQuizQuestion();
      }, 1000);
    } else {
      setStreak(0);
      
      // 少し待ってから次の問題
      setTimeout(() => {
        generateQuizQuestion();
      }, 1500);
    }
  };

  // フラッシュカード問題の生成
  const generateFlashcardQuestion = () => {
    if (reviewCards.length === 0) {
      // 全問終了したら最初からやり直し
      resetFlashcards();
      return;
    }
    
    // レビューカードから次の問題を取得
    const nextQuestion = reviewCards[0];
    setFlashcardQuestion(nextQuestion);
    setShowAnswer(false);
  };

  // フラッシュカードの回答処理
  const handleFlashcardResponse = (known) => {
    const currentCard = { ...flashcardQuestion };
    const remainingReviewCards = [...reviewCards.slice(1)];
    
    if (known) {
      // 知っている場合は既知リストに追加
      setKnownCards([...knownCards, currentCard]);
      
      // マスター状態を更新
      const key = `${currentCard.num1}x${currentCard.num2}`;
      const newMastered = { ...masteredTables, [key]: true };
      setMasteredTables(newMastered);
      localStorage.setItem('masteredTables', JSON.stringify(newMastered));
    } else {
      // 知らない場合は後ろに戻す (5問後くらいに)
      const insertPosition = Math.min(remainingReviewCards.length, 5);
      remainingReviewCards.splice(insertPosition, 0, currentCard);
    }
    
    setReviewCards(remainingReviewCards);
    
    // 次の問題へ
    setTimeout(() => {
      generateFlashcardQuestion();
    }, 300);
  };

  // テスト問題の生成
  const generateTestQuestions = () => {
    const questions = [];
    
    // 現在の段のテスト
    for (let i = 1; i <= 19; i++) {
      questions.push({
        num1: currentTable,
        num2: i,
        answer: currentTable * i,
        userAnswer: null,
        correct: null
      });
    }
    
    setTestQuestions(questions);
    setCurrentQuestion(0);
    setTestFinished(false);
    setScore(0);
  };

  // タイマー開始
  const startTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    setTimer(0);
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    
    setTimerInterval(interval);
  };

  // 時間フォーマット
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // マスター率を計算
  const calculateMasteryRate = (table) => {
    let total = 0;
    let mastered = 0;
    
    for (let i = 1; i <= 19; i++) {
      const key = `${table}x${i}`;
      if (masteredTables[key]) {
        mastered++;
      }
      total++;
    }
    
    return total > 0 ? Math.round((mastered / total) * 100) : 0;
  };

  // 答えの色を取得（記憶の視覚的手掛かり）
  const getAnswerColor = (answer) => {
    if (!showColorCoding) return 'bg-white';
    
    // 10の倍数は青
    if (answer % 10 === 0) return 'bg-blue-100';
    // 5の倍数は緑
    if (answer % 5 === 0) return 'bg-green-100';
    // 偶数は黄色
    if (answer % 2 === 0) return 'bg-yellow-50';
    // 奇数はピンク
    return 'bg-pink-50';
  };

  // 掛け算のコツを生成
  const generateTip = (table) => {
    if (table === 9) {
      return "9の段は十の位と一の位の数字を足すと9になります。例: 9×7=63→6+3=9";
    } else if (table === 11) {
      return "11の1桁の数との掛け算は、その数を2回繰り返すだけです。例: 11×3=33";
    } else if (table % 5 === 0) {
      return `${table}は5の倍数なので、結果はすべて0か5で終わります。`;
    } else if (table > 10) {
      const base10 = 10;
      const remainder = table - base10;
      return `${table}は${base10}+${remainder}なので、${base10}の段と${remainder}の段の和と考えられます。`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-6">
          フラッシュカード＆4択式 掛け算暗記アプリ
        </h1>
        
        {/* モード選択ボタン */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button 
            onClick={() => changeMode('learn')}
            className={`px-4 py-2 rounded-lg ${mode === 'learn' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            学習モード
          </button>
          <button 
            onClick={() => changeMode('quiz')}
            className={`px-4 py-2 rounded-lg ${mode === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            4択クイズ
          </button>
          <button 
            onClick={() => changeMode('flashcard')}
            className={`px-4 py-2 rounded-lg ${mode === 'flashcard' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            フラッシュカード
          </button>
          <button 
            onClick={() => changeMode('test')}
            className={`px-4 py-2 rounded-lg ${mode === 'test' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            テストモード
          </button>
        </div>
        
        {/* 段の選択 */}
        <div className="mb-6">
          <h3 className="text-center mb-2 font-semibold">
            {mode === 'learn' ? "学習する段" : 
             mode === 'quiz' ? "クイズする段" : 
             mode === 'flashcard' ? "フラッシュカードの段" :
             "テストする段"}を選択
          </h3>
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            <button
              onClick={() => changeTable(0)}
              className={`px-3 py-1 rounded-full ${currentTable === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              ランダム
            </button>
            {Array.from({ length: 19 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => changeTable(num)}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  currentTable === num ? 'bg-blue-600 text-white' : 
                  num <= 9 ? 'bg-blue-100' : 'bg-green-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          {currentTable > 0 && (
            <div className="text-center text-sm text-gray-600">
              {currentTable}の段 - マスター率: {calculateMasteryRate(currentTable)}%
            </div>
          )}
        </div>
        
        {/* 学習サポート設定 */}
        <div className="flex justify-center mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showColorCoding}
              onChange={() => setShowColorCoding(!showColorCoding)}
              className="mr-1"
            />
            <span className="text-sm">色による記憶補助</span>
          </label>
        </div>
        
        {/* 学習モード */}
        {mode === 'learn' && (
          <div>
            {/* 記憶のコツ */}
            {currentTable > 0 && generateTip(currentTable) && (
              <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">記憶のコツ:</h3>
                <p>{generateTip(currentTable)}</p>
              </div>
            )}
            
            {/* 九九表 */}
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 19 }, (_, i) => i + 1).map(num => {
                const answer = currentTable * num;
                const key = `${currentTable}x${num}`;
                
                return (
                  <div 
                    key={num} 
                    className={`p-3 border rounded-lg ${getAnswerColor(answer)} ${
                      masteredTables[key] ? 'border-green-400' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-lg">
                        {currentTable} × {num} = {answer}
                      </div>
                      {masteredTables[key] && (
                        <div className="text-green-500">✓</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 4択クイズモード */}
        {mode === 'quiz' && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-2">
                連続正解: {streak}問
              </div>
              
              <div className="text-4xl font-bold mb-6">
                {quizQuestion.num1} × {quizQuestion.num2} = ?
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {quizOptions.map((option, index) => (
                  <button
                    key={index}
                    className={`p-4 text-xl font-bold rounded-lg border-2 
                      ${selectedAnswer === option ? 
                        (quizResult !== null ? 
                          (quizResult ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500') 
                          : 'bg-blue-100 border-blue-500') 
                        : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                    onClick={() => selectedAnswer === null && checkQuizAnswer(option)}
                    disabled={selectedAnswer !== null}
                  >
                    {option}
                  </button>
                ))}
              </div>
              
              {quizResult !== null && (
                <div className={`mt-6 text-xl font-bold ${quizResult ? 'text-green-500' : 'text-red-500'}`}>
                  {quizResult 
                    ? '正解！' 
                    : `不正解... 正解は ${quizQuestion.num1 * quizQuestion.num2} です`}
                </div>
              )}
            </div>
            
            <button
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => generateQuizQuestion()}
            >
              次の問題
            </button>
          </div>
        )}
        
        {/* フラッシュカードモード */}
        {mode === 'flashcard' && (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center text-sm text-gray-600">
              残り: {reviewCards.length}問 / 習得済み: {knownCards.length}問
            </div>
            
            {flashcardQuestion && (
              <div 
                className="w-full max-w-md h-64 rounded-xl border-2 border-gray-300 flex items-center justify-center cursor-pointer mb-6 relative overflow-hidden"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-4">
                    {flashcardQuestion.num1} × {flashcardQuestion.num2} = {showAnswer ? flashcardQuestion.num1 * flashcardQuestion.num2 : "?"}
                  </div>
                  
                  {!showAnswer && (
                    <div className="text-sm text-gray-500">
                      タップして答えを表示
                    </div>
                  )}
                  
                  {showAnswer && (
                    <div className={`text-xl font-bold mt-4 ${getAnswerColor(flashcardQuestion.num1 * flashcardQuestion.num2)} p-2 rounded-lg`}>
                      {flashcardQuestion.num1 * flashcardQuestion.num2}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {showAnswer && (
              <div className="flex gap-4">
                <button
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  onClick={() => handleFlashcardResponse(false)}
                >
                  もう一度
                </button>
                <button
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  onClick={() => handleFlashcardResponse(true)}
                >
                  覚えた
                </button>
              </div>
            )}
            
            {!showAnswer && reviewCards.length > 0 && (
              <button
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                onClick={() => setShowAnswer(true)}
              >
                答えを見る
              </button>
            )}
            
            {reviewCards.length === 0 && (
              <div className="text-center mt-8">
                <p className="text-xl font-bold text-green-500 mb-4">全問完了！</p>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => resetFlashcards()}
                >
                  最初からやり直す
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* テストモード */}
        {mode === 'test' && !testFinished && testQuestions.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-500 mb-2">
              問題 {currentQuestion + 1}/{testQuestions.length} | 
              時間: {formatTime(timer)}
            </div>
            
            <div className="text-4xl font-bold mb-4">
              {testQuestions[currentQuestion].num1} × {testQuestions[currentQuestion].num2} = ?
            </div>
            
            {/* 省略：テストモードのUI */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedMultiplicationApp;