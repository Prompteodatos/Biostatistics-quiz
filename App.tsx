import React, { useState, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import { AppState, QuizMode, Question, UserAnswer } from './types';
import { generateQuiz } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Home);
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(10);

  const handleStartQuiz = useCallback(async (mode: QuizMode, options?: { topics?: string[], hashtag?: string }) => {
    setIsLoading(true);
    setError(null);
    setQuizMode(mode);
    try {
      const generatedQuestions = await generateQuiz(mode, numQuestions, options);
      setQuestions(generatedQuestions);
      setUserAnswers(new Array(generatedQuestions.length).fill(null));
      setAppState(AppState.Quiz);
    } catch (err) {
      setError('Error al generar el cuestionario. Por favor, inténtalo de nuevo.');
      console.error(err);
      setAppState(AppState.Home);
    } finally {
      setIsLoading(false);
    }
  }, [numQuestions]);

  const handleFinishQuiz = useCallback((finalAnswers: UserAnswer[], time: number) => {
    setUserAnswers(finalAnswers);
    setTimeTaken(time);
    setAppState(AppState.Results);
  }, []);

  const handleRestart = useCallback(() => {
    setQuestions([]);
    setUserAnswers([]);
    setTimeTaken(0);
    setQuizMode(null);
    setError(null);
    setAppState(AppState.Home);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <LoadingSpinner />
          <p className="mt-4 text-sky-300">Generando tu cuestionario de {numQuestions} preguntas con IA...</p>
        </div>
      );
    }

    switch (appState) {
      case AppState.Home:
        return <HomeScreen onStartQuiz={handleStartQuiz} error={error} numQuestions={numQuestions} onNumQuestionsChange={setNumQuestions} />;
      case AppState.Quiz:
        return <QuizScreen questions={questions} onFinish={handleFinishQuiz} />;
      case AppState.Results:
        return <ResultsScreen questions={questions} userAnswers={userAnswers} timeTaken={timeTaken} onRestart={handleRestart} quizMode={quizMode} />;
      default:
        return <HomeScreen onStartQuiz={handleStartQuiz} error={error} numQuestions={numQuestions} onNumQuestionsChange={setNumQuestions}/>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 md:p-8 flex flex-col">
      <main className="flex-grow flex flex-col">
        {renderContent()}
      </main>
      <footer className="text-center text-slate-400 text-sm mt-8 pt-4 border-t border-slate-700">
        <p>En caso de alguna duda con respecto a las preguntas y sus respuestas, escribir a <a href="mailto:alejandrosuwezda@gmail.com" className="text-sky-400 hover:underline">alejandrosuwezda@gmail.com</a>.</p>
        <p className="mt-2">© 2025 Alejandro Suwezda</p>
      </footer>
    </div>
  );
};

export default App;