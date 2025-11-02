
import { GoogleGenAI, Type } from '@google/genai';
import { QuizMode, Question } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getPrompt = (mode: QuizMode, numQuestions: number, options?: { topics?: string[]; hashtag?: string }): string => {
  const numCalculations = Math.round(numQuestions * 0.2);
  const numConceptual = numQuestions - numCalculations;

  let topicDiversityRule = '';
    if (numQuestions >= 50) {
        topicDiversityRule = 'Las preguntas deben cubrir al menos 15 temas distintos de la bioestadística.';
    } else if (numQuestions >= 20) {
        topicDiversityRule = 'Las preguntas deben cubrir al menos 10 temas distintos de la bioestadística.';
    } else if (numQuestions >= 10) {
        topicDiversityRule = 'Las preguntas deben cubrir al menos 6 temas distintos de la bioestadística.';
    } else {
        topicDiversityRule = 'Las preguntas deben cubrir tantos temas distintos como sea posible.';
    }
    
  let prompt = `
    Eres un experto en bioestadística y un excelente docente para estudiantes de ciencias de la salud de grado y posgrado.
    Tu tarea es generar un cuestionario de ${numQuestions} preguntas de bioestadística de dificultad leve a moderada.
    El cuestionario debe estar perfectamente balanceado con la siguiente estructura:
    - ${numCalculations} preguntas de tipo "cálculo sencillo".
    - ${numConceptual} preguntas de tipo "conceptual/razonamiento".
    - ${topicDiversityRule}
    - No debe haber más de ${Math.max(3, Math.ceil(numQuestions / 4))} preguntas del mismo tema.

    Cada pregunta debe tener:
    - Un ID único.
    - El texto de la pregunta.
    - 4 opciones de respuesta (A, B, C, D), donde solo una es correcta.
    - La letra de la respuesta correcta.
    - Una explicación detallada:
        - "correct": Una explicación de 2-4 líneas de por qué la respuesta es correcta, usando un enfoque clínico o práctico cuando sea posible.
        - "incorrect": Explicaciones para las otras 3 opciones, de 1-2 líneas cada una, aclarando malentendidos comunes.
    - El tema de bioestadística al que pertenece.
    - El tipo de pregunta: "cálculo sencillo" o "conceptual/razonamiento".
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
        type: { type: Type.STRING, description: "Tipo de pregunta: 'cálculo sencillo' o 'conceptual/razonamiento'." },
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
            if (key !== q.answer && q.explanation.incorrect[key]) {
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
