
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Question, UserAnswer } from '../types';

interface QuizScreenProps {
  questions: Question[];
  onFinish: (answers: UserAnswer[], time: number) => void;
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const progressPercentage = (current / total) * 100;
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-sky-300">
        <span>Progreso</span>
        <span className="text-sm font-semibold">{current}/{total}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div
          className="bg-sky-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        ></div>
      </div>
    </div>
  );
};

const QuizScreen: React.FC<QuizScreenProps> = ({ questions, onFinish }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<keyof Question['options'] | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    setUserAnswers(
      questions.map(q => ({
        questionId: q.id,
        answer: null,
        isCorrect: null,
      }))
    );
  }, [questions]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);
  const currentAnswer = useMemo(() => userAnswers[currentQuestionIndex], [userAnswers, currentQuestionIndex]);

  useEffect(() => {
      if (currentAnswer && currentAnswer.answer) {
        setSelectedOption(currentAnswer.answer);
        setShowExplanation(true);
      } else {
        setSelectedOption(null);
        setShowExplanation(false);
      }
  }, [currentQuestionIndex, currentAnswer]);

  const handleOptionSelect = (option: keyof Question['options']) => {
    if (showExplanation) return;
    setSelectedOption(option);
    setShowExplanation(true);
    const isCorrect = option === currentQuestion.answer;
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      answer: option,
      isCorrect,
    };
    setUserAnswers(newAnswers);
  };
  
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  },[currentQuestionIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getOptionClasses = (option: keyof Question['options']) => {
    let baseClasses = "w-full text-left p-4 my-2 border-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-start";
    if (!showExplanation) {
      return `${baseClasses} border-slate-600 hover:bg-slate-700 hover:border-sky-500`;
    }
    if (option === currentQuestion.answer) {
      return `${baseClasses} bg-green-900/50 border-green-500`;
    }
    if (option === selectedOption) {
      return `${baseClasses} bg-red-900/50 border-red-500`;
    }
    return `${baseClasses} border-slate-700 bg-slate-800`;
  };

  if (!currentQuestion) return null;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full w-full">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <ProgressBar current={userAnswers.filter(a => a.answer !== null).length} total={questions.length} />
        <div className="flex-shrink-0 bg-slate-800 px-4 py-2 rounded-lg font-mono text-xl text-sky-300">{formatTime(timer)}</div>
      </header>

      <main className="flex-grow">
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
          <p className="text-sm text-sky-400 font-medium mb-2">{currentQuestion.topic} ({currentQuestion.type})</p>
          <h2 className="text-xl md:text-2xl font-semibold text-white leading-snug">{currentQuestionIndex + 1}. {currentQuestion.question}</h2>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {(Object.keys(currentQuestion.options) as Array<keyof Question['options']>).map(key => (
            <button
              key={key}
              onClick={() => handleOptionSelect(key)}
              disabled={showExplanation}
              className={getOptionClasses(key)}
              aria-pressed={selectedOption === key}
            >
                <span className="font-bold mr-3">{key}.</span>
                <span>{currentQuestion.options[key]}</span>
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className="mt-6 p-5 bg-slate-800/70 border border-slate-700 rounded-lg animate-fade-in">
            <h3 className="text-lg font-bold text-green-400">✓ Por qué es correcta ({currentQuestion.answer}):</h3>
            <p className="mt-1 text-slate-200">{currentQuestion.explanation.correct}</p>
            
            <h3 className="text-lg font-bold text-red-400 mt-4">✗ Por qué no lo son:</h3>
            <ul className="mt-1 space-y-2 text-slate-300">
               {(Object.keys(currentQuestion.options) as Array<keyof Question['options']>).filter(key => key !== currentQuestion.answer).map(key => (
                  <li key={key}><span className="font-bold">{key}:</span> {currentQuestion.explanation.incorrect[key]}</li>
               ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="mt-8 pt-4 border-t border-slate-700 flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 rounded-md font-bold text-white"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={() => onFinish(userAnswers, timer)}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-md font-bold text-white"
          >
            Finalizar
          </button>
        )}
      </footer>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default QuizScreen;
