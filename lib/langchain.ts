import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-pro',
});

// Template for generating quiz questions
const quizTemplate = `Create a quiz about the following topic and concept:
Topic: {topic}
Concept: {concept}

Generate {numQuestions} multiple choice questions that test understanding of the concept.
Each question should have 4 options with one correct answer.

Format the response as a JSON array of objects with the following structure:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0 // Index of correct option (0-3)
  }
]

Make sure the questions are challenging and test deep understanding.`;

const quizPrompt = PromptTemplate.fromTemplate(quizTemplate);

// Chain for generating quiz questions
export const createQuizChain = RunnableSequence.from([
  quizPrompt,
  model,
  new StringOutputParser(),
]);

// Helper function to generate quiz questions
export async function generateQuizQuestions(
  topic: string,
  concept: string,
  numQuestions: number = 3
) {
  try {
    const result = await createQuizChain.invoke({
      topic,
      concept,
      numQuestions: numQuestions.toString(),
    });

    // Parse the JSON response
    const questions = JSON.parse(result);
    return questions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw error;
  }
}