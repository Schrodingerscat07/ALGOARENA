import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-pro',
});

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, concept, numQuestions = 3 } = body;

    if (!topic || !concept) {
      return NextResponse.json(
        { error: 'Topic and concept are required' },
        { status: 400 }
      );
    }

    const promptValue = await quizPrompt.format({
      topic,
      concept,
      numQuestions: numQuestions.toString(),
    });

    const result = await model.invoke(promptValue);
    const questions = JSON.parse(result.text);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
}