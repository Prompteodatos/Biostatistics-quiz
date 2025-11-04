
import { GoogleGenAI, Type } from '@google/genai';
import { QuizMode, Question } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getPrompt = (mode: QuizMode, numQuestions: number, options?: { topics?: string[]; hashtag?: string }): string => {
  const numChart = Math.floor(numQuestions / 10);
  const numOutput = Math.floor(numQuestions / 10);
    
  let prompt = `
    Eres un experto en bioestadística y un excelente docente para estudiantes de ciencias de la salud de grado y posgrado.
    Tu tarea es generar un cuestionario de ${numQuestions} preguntas de bioestadística de dificultad leve a moderada.

    El cuestionario DEBE incluir la siguiente composición:
    - EXACTAMENTE ${numChart} preguntas de tipo "interpretación de gráfico".
    - EXACTAMENTE ${numOutput} preguntas de tipo "interpretación de salida".
    - El resto de las preguntas deben ser una mezcla de "cálculo sencillo" y "conceptual/razonamiento".

    REGLAS IMPORTANTES:
    1.  Para preguntas de "interpretación de gráfico":
        - Debes generar un GRÁFICO relevante (histograma, boxplot, curva ROC, etc.) como CÓDIGO SVG y colocarlo en el campo "svgChart". El SVG debe ser claro, legible, con ejes etiquetados y visualmente autocontenido (sin dependencias externas, con estilos inline).
        - La pregunta debe ser sobre la interpretación de ese gráfico.
    2.  Para preguntas de "interpretación de salida":
        - Debes generar una TABLA o salida de un programa estadístico (como R, SPSS, Stata) y colocarla como texto plano formateado en el campo "statisticalOutput".
        - La pregunta debe ser sobre la interpretación de esa salida.
    3.  Para el resto de las preguntas, mantén un buen balance entre temas y entre "cálculo sencillo" y "conceptual/razonamiento".
    4.  Diversidad de temas: No debe haber más de ${Math.max(3, Math.ceil(numQuestions / 4))} preguntas del mismo tema en todo el cuestionario.

    Cada pregunta debe tener la siguiente estructura JSON:
    - id: Un ID único.
    - question: El texto de la pregunta.
    - options: 4 opciones de respuesta (A, B, C, D).
    - answer: La letra de la respuesta correcta.
    - explanation: Explicaciones detalladas para la opción correcta e incorrectas.
    - topic: El tema de bioestadística.
    - type: El tipo de pregunta ('interpretación de gráfico', 'interpretación de salida', 'cálculo sencillo', o 'conceptual/razonamiento').
    - svgChart: (SOLO para tipo 'interpretación de gráfico') Una cadena de texto con el código SVG completo del gráfico.
    - statisticalOutput: (SOLO para tipo 'interpretación de salida') Una cadena de texto con la salida del software estadístico.
  `;

  switch (mode) {
    case QuizMode.Topic:
      prompt += `\nEnfócate en los siguientes temas, pero manteniendo el balance general: ${options?.topics?.join(', ')}. Si no es posible mantener el balance estricto con los temas seleccionados, prioriza los temas pero acércate al balance lo más posible.`;
      break;
    case QuizMode.Hashtag:
      prompt += `\nFiltra las preguntas para que estén relacionadas con el hashtag: "${options?.hashtag}". Intenta mantener el balance de tipos y temas dentro de esta restricción.`;
      break;
    case QuizMode.Random:
    default:
      prompt += `\nGenera un cuestionario aleatorio que cumpla con todas las reglas de balance mencionadas.`;
      break;
  }

  prompt += `\nDevuelve el resultado exclusivamente como un objeto JSON que sea un array de ${numQuestions} elementos, y que se ajuste al esquema proporcionado. No incluyas ninguna otra explicación o texto fuera del JSON.`;
  return prompt;
};

const questionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "ID único de la pregunta, ej: BIO-101" },
        question: { type: Type.STRING, description: "El texto de la pregunta." },
        options: {
            type: Type.OBJECT,
            properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
            },
            required: ["A", "B", "C", "D"]
        },
        answer: { type: Type.STRING, description: "La letra de la opción correcta (A, B, C, o D)." },
        explanation: {
            type: Type.OBJECT,
            properties: {
                correct: { type: Type.STRING, description: "Explicación de por qué la respuesta es correcta." },
                incorrect: {
                    type: Type.OBJECT,
                    properties: {
                        A: { type: Type.STRING, description: "Explicación si A es incorrecta." },
                        B: { type: Type.STRING, description: "Explicación si B es incorrecta." },
                        C: { type: Type.STRING, description: "Explicación si C es incorrecta." },
                        D: { type: Type.STRING, description: "Explicación si D es incorrecta." },
                    },
                },
            },
            required: ["correct", "incorrect"]
        },
        topic: { type: Type.STRING, description: "El tema de bioestadística." },
        type: { type: Type.STRING, description: "Tipo de pregunta: 'cálculo sencillo', 'conceptual/razonamiento', 'interpretación de gráfico', o 'interpretación de salida'." },
        svgChart: { type: Type.STRING, description: "Código SVG completo para un gráfico a interpretar. Usar solo para tipo 'interpretación de gráfico'." },
        statisticalOutput: { type: Type.STRING, description: "Texto pre-formateado de una salida de software estadístico. Usar solo para tipo 'interpretación de salida'." },
    },
    required: ["id", "question", "options", "answer", "explanation", "topic", "type"]
};

export const generateQuiz = async (
  mode: QuizMode,
  numQuestions: number,
  options?: { topics?: string[]; hashtag?: string }
): Promise<Question[]> => {
  const prompt = getPrompt(mode, numQuestions, options);

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: questionSchema,
            },
        },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('La respuesta de la API no es un array de preguntas válido.');
    }

    // Gemini might not perfectly adhere to option keys in explanation.incorrect. Let's fix it.
    return parsedData.map(q => {
        const incorrectExplanations: { [key: string]: string } = {};
        const optionsKeys = Object.keys(q.options) as Array<keyof Question['options']>;
        
        for (const key of optionsKeys) {
            if (key !== q.answer && q.explanation.incorrect && q.explanation.incorrect[key]) {
                incorrectExplanations[key] = q.explanation.incorrect[key];
            }
        }
        q.explanation.incorrect = incorrectExplanations;
        return q as Question;
    });

  } catch (error) {
    console.error('Error fetching from Gemini API:', error);
    throw new Error('No se pudieron generar las preguntas. Por favor, revisa tu conexión o la configuración de la API.');
  }
};