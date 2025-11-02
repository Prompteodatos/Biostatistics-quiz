
import React, { useState } from 'react';
import { QuizMode } from '../types';
import { BIOSTATISTICS_TOPICS } from '../constants';
import BarChartIcon from './icons/BarChartIcon';
import RandomIcon from './icons/RandomIcon';
import TopicIcon from './icons/TopicIcon';
import HashtagIcon from './icons/HashtagIcon';

interface HomeScreenProps {
  onStartQuiz: (mode: QuizMode, options?: { topics?: string[], hashtag?: string }) => void;
  error: string | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartQuiz, error }) => {
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [hashtag, setHashtag] = useState('');

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const startWithTopics = () => {
    if (selectedTopics.length > 0) {
      onStartQuiz(QuizMode.Topic, { topics: selectedTopics });
    }
  };

  const startWithHashtag = () => {
    if (hashtag.trim() !== '') {
      onStartQuiz(QuizMode.Hashtag, { hashtag: hashtag.trim() });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center">
      <div className="max-w-3xl mx-auto">
        <BarChartIcon className="h-24 w-24 mx-auto text-sky-400" />
        <h1 className="text-4xl sm:text-5xl font-bold mt-4">
          Preguntas para aprender <span className="text-sky-300">Bioestadística</span>
        </h1>
        <p className="text-lg text-slate-300 mt-2">— Diseñado por IA —</p>
        <p className="mt-6 text-md sm:text-lg text-slate-200">
          Cada pregunta te ayudará a afianzar conceptos clave de estadística aplicada a la salud.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Contenido supervisado por Alejandro Suwezda, médico pediatra y docente especializado en bioestadística y análisis de datos biomédicos.
        </p>

        {error && <p className="mt-6 text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <button
            onClick={() => onStartQuiz(QuizMode.Random)}
            className="flex items-center justify-center gap-3 p-4 bg-sky-600 hover:bg-sky-500 rounded-lg shadow-lg text-white font-semibold text-lg transition-transform transform hover:scale-105"
            aria-label="Iniciar cuestionario aleatorio"
          >
            <RandomIcon className="h-6 w-6" />
            Cuestionario Aleatorio
          </button>
          <button
            onClick={() => { setShowTopicSelector(!showTopicSelector); setShowHashtagInput(false); }}
            className="flex items-center justify-center gap-3 p-4 bg-sky-600 hover:bg-sky-500 rounded-lg shadow-lg text-white font-semibold text-lg transition-transform transform hover:scale-105"
            aria-label="Elegir cuestionario por tema"
          >
            <TopicIcon className="h-6 w-6" />
            Elegir por Tema
          </button>
          <button
            onClick={() => { setShowHashtagInput(!showHashtagInput); setShowTopicSelector(false); }}
            className="flex items-center justify-center gap-3 p-4 bg-sky-600 hover:bg-sky-500 rounded-lg shadow-lg text-white font-semibold text-lg transition-transform transform hover:scale-105"
            aria-label="Buscar cuestionario por hashtag"
          >
            <HashtagIcon className="h-6 w-6" />
            Buscar por Hashtag
          </button>
        </div>

        {showTopicSelector && (
          <div className="mt-6 p-6 bg-slate-800 rounded-lg w-full text-left">
            <h3 className="text-xl font-semibold mb-4 text-sky-300">Selecciona uno o más temas:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
              {BIOSTATISTICS_TOPICS.map(topic => (
                <label key={topic} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic)}
                    onChange={() => handleTopicToggle(topic)}
                    className="form-checkbox h-5 w-5 text-green-500 bg-slate-600 border-slate-500 rounded focus:ring-green-400"
                  />
                  <span className="text-slate-200">{topic}</span>
                </label>
              ))}
            </div>
            <button
              onClick={startWithTopics}
              disabled={selectedTopics.length === 0}
              className="mt-4 w-full p-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              Iniciar Cuestionario por Tema
            </button>
          </div>
        )}

        {showHashtagInput && (
          <div className="mt-6 p-6 bg-slate-800 rounded-lg w-full">
            <h3 className="text-xl font-semibold mb-4 text-sky-300">Busca por etiqueta (ej: p-valor, ensayo clínico):</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="#regresionlogistica"
                className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={startWithHashtag}
                disabled={hashtag.trim() === ''}
                className="p-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Buscar e Iniciar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default HomeScreen;
