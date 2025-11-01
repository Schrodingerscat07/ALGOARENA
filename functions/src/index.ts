import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
// Make sure to set this in Firebase Functions config:
// firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
const genAI = new GoogleGenerativeAI(
  functions.config().gemini?.api_key || process.env.GEMINI_API_KEY || ''
);

export const generateAiQuestions = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { context: quizContext } = data;

  if (!quizContext || typeof quizContext !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a valid context string.'
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a helpful tutor. Based only on the following context, generate 3-5 intuitive, open-ended questions to test a student's deep understanding. 
    
Context: ${quizContext}

Return ONLY a JSON array of question strings, like this:
["Question 1?", "Question 2?", "Question 3?"]

Do not include any other text or explanation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse the JSON array from the response
    let questions: string[] = [];
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract questions from plain text
      const lines = text.split('\n').filter((line) => line.trim().length > 0);
      questions = lines
        .map((line) => {
          // Remove numbering if present
          return line.replace(/^\d+[.)]\s*/, '').trim();
        })
        .filter((q) => q.length > 0);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Failed to generate questions');
    }

    return { questions };
  } catch (error: any) {
    console.error('Error generating AI questions:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate AI questions: ' + error.message
    );
  }
});

export const gradeAiAnswers = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { context: quizContext, questions, answers } = data;

  if (
    !quizContext ||
    typeof quizContext !== 'string' ||
    !Array.isArray(questions) ||
    !Array.isArray(answers) ||
    questions.length !== answers.length
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with valid context, questions array, and answers array of equal length.'
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert grader. Based on the following context, grade the user's answers to the questions. Provide a score from 0-100, brief feedback, and a boolean "passed" (true if score > 75).

Context: ${quizContext}

Questions and Answers:
${questions
  .map(
    (q: string, i: number) => `
Question ${i + 1}: ${q}
Answer ${i + 1}: ${answers[i]}
`
  )
  .join('\n')}

Return ONLY a JSON object in this exact format:
{
  "score": 85,
  "feedback": "You understood X well, but you missed Y. Consider reviewing Z.",
  "passed": true
}

Do not include any other text or explanation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse the JSON object from the response
    let gradeResult: { score: number; feedback: string; passed: boolean };
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      gradeResult = JSON.parse(cleanedText);
    } catch (parseError) {
      throw new Error('Failed to parse grading result');
    }

    // Validate the result
    if (
      typeof gradeResult.score !== 'number' ||
      typeof gradeResult.feedback !== 'string' ||
      typeof gradeResult.passed !== 'boolean'
    ) {
      throw new Error('Invalid grading result format');
    }

    // Ensure score is within 0-100
    gradeResult.score = Math.max(0, Math.min(100, gradeResult.score));

    return gradeResult;
  } catch (error: any) {
    console.error('Error grading AI answers:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to grade AI answers: ' + error.message
    );
  }
});

