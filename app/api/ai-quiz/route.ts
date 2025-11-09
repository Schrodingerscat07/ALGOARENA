import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

function validateApiKey(): string {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('ERROR: GOOGLE_API_KEY is not set in environment variables!');
    throw new Error('API key not configured');
  }

  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    console.error('ERROR: GOOGLE_API_KEY is empty or invalid!');
    throw new Error('Invalid API key format');
  }

  return apiKey;
}

const initializeGeminiClient = () => {
  const apiKey = validateApiKey();
  
  try {
    return new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: 'gemini-2.5-flash', // Using the model that works with your API key
      maxOutputTokens: 2048,
    });
  } catch (error) {
    console.error('ERROR: Failed to initialize Gemini client:', error);
    throw new Error('Failed to initialize AI client');
  }
};

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  console.log('Starting AI quiz generation request...');
  
  try {
    // 1. Validate environment
    if (!process.env.GOOGLE_API_KEY) {
      console.error('ERROR: GOOGLE_API_KEY is not set!');
      return NextResponse.json(
        { error: 'AI service not configured - missing API key' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { topic, concept } = body;

    if (!topic || !concept) {
      console.warn('Invalid request: Missing topic or concept');
      return NextResponse.json(
        { error: 'Topic and concept are required' },
        { status: 400 }
      );
    }

    console.log('Generating quiz for:', { topic, concept });

    // 3. Initialize AI client and prepare prompt
    let model;
    try {
      model = initializeGeminiClient();
      console.log('Successfully initialized Gemini client');
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
      return NextResponse.json(
        { error: 'AI service configuration error' },
        { status: 503 }
      );
    }

    const prompt = `Generate exactly 3 multiple choice questions about ${topic}, focusing on ${concept}.
    Return ONLY a JSON array with no additional text.
    Each question must have:
    1. A clear, concise question
    2. Exactly 4 answer options
    3. A correctAnswer number (0-3) indicating the correct option's index
    
    Required JSON format:
    [
      {
        "question": "What is...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0
      }
    ]

    Do not include any text before or after the JSON array.
    Ensure all JSON is properly formatted with double quotes.`;

    // 4. Generate questions
    console.log('Sending prompt to Gemini...');
    let result;
    try {
      result = await model.invoke(prompt);
      console.log('Raw Gemini response:', result.text);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return NextResponse.json({
        error: 'Failed to generate questions',
        details: error instanceof Error ? error.message : 'Unknown API error'
      }, { status: 500 });
    }
    let questions;
    
    try {
      // Try to parse the response as JSON
      questions = JSON.parse(result.text);

      // Validate the response structure
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Validate each question object
      questions = questions.map((q: any, index: number) => {
        if (
          typeof q.question !== 'string' ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          typeof q.correctAnswer !== 'number' ||
          q.correctAnswer < 0 ||
          q.correctAnswer > 3
        ) {
          throw new Error(`Invalid question format at index ${index}`);
        }
        return {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        };
      });
    } catch (e) {
      console.error('Failed to parse AI response:', e, '\nRaw response:', result.text);
      return NextResponse.json(
        { error: 'Failed to generate valid quiz format' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
}