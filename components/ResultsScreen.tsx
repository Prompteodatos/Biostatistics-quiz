
import React from 'react';
import { Question, UserAnswer, QuizMode } from '../types';

interface ResultsScreenProps {
  questions: Question[];
  userAnswers: UserAnswer[];
  timeTaken: number;
  onRestart: () => void;
  quizMode: QuizMode | null;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ questions, userAnswers, timeTaken, onRestart, quizMode }) => {
  const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  const getMotivationalMessage = () => {
    if (scorePercentage <= 50) {
      return "Buen comienzo. Revisa los conceptos clave y vuelve a intentarlo.";
    }
    if (scorePercentage <= 80) {
      return "Vas muy bien. Pulamos detalles estadísticos finos.";
    }
    return "¡Excelente manejo! Estás lista/o para problemas más complejos.";
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveResults = () => {
    const date = new Date().toLocaleString('es-ES');
    let content = `Resultados del Cuestionario de Bioestadística\n`;
    content += `Fecha: ${date}\n`;
    content += `Modo: ${quizMode || 'N/A'}\n`;
    content += `Tiempo Utilizado: ${formatTime(timeTaken)}\n`;
    content += `Aciertos: ${correctAnswers}/${totalQuestions} (${scorePercentage.toFixed(1)}%)\n\n`;
    content += `--- DETALLE DE PREGUNTAS ---\n\n`;

    questions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      content += `Pregunta ID: ${q.id}\n`;
      content += `Tema: ${q.topic}\n`;
      content += `Pregunta: ${q.question}\n`;
      content += `Tu respuesta: ${userAnswer.answer || 'No respondida'}\n`;
      content += `Respuesta correcta: ${q.answer}\n`;
      content += `Resultado: ${userAnswer.isCorrect ? 'Correcta' : 'Incorrecta'}\n`;
      content += `---------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_bioestadistica_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center max-w-2xl mx-auto">
      <div className="w-full bg-slate-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-4xl font-bold text-sky-300">Resultados Finales</h2>
        
        <div className="my-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-white">
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="text-4xl font-bold">{correctAnswers}<span className="text-2xl text-slate-400">/{totalQuestions}</span></div>
            <div className="text-sm text-slate-300 mt-1">Aciertos</div>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="text-4xl font-bold">{scorePercentage.toFixed(0)}<span className="text-2xl text-slate-400">%</span></div>
            <div className="text-sm text-slate-300 mt-1">Porcentaje</div>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="text-4xl font-bold font-mono">{formatTime(timeTaken)}</div>
            <div className="text-sm text-slate-300 mt-1">Tiempo Utilizado</div>
          </div>
        </div>

        <p className="text-lg text-slate-200 italic my-8">"{getMotivationalMessage()}"</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-lg transition-transform transform hover:scale-105"
          >
            Intentar Nuevamente
          </button>
          <button
            onClick={handleSaveResults}
            className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-lg transition-transform transform hover:scale-105"
          >
            Guardar Resultados (.txt)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
