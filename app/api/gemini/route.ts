import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

// Secure server-side proxy to call Google Generative API (Gemini / text models)
// IMPORTANT: Do NOT hard-code API keys. Set the key in your deployment environment as
// GOOGLE_API_KEY (or update the code to use a secret manager). This route will return
// an error if the key is not present.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, detailedDescription, links, model = process.env.GENERATIVE_MODEL || 'models/text-bison-001' } = body || {};

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server error: Google API key not configured. Set GOOGLE_API_KEY in server environment.' }, { status: 500 });
    }

    // If a courseId is provided, try to fetch the course details from Firestore to enrich the prompt
    let courseText = '';
    if (courseId) {
      try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          const data = courseSnap.data() as any;
          courseText += `Course Title: ${data.title || ''}\n`;
          courseText += `Short Description: ${data.description || ''}\n`;
          courseText += `Detailed Description: ${data.detailedDescription || ''}\n`;
          // If stored graphData contains nodes with links in levels, those should be fetched by levels collection
          const levelsSnapshot = await getDocs(collection(db, 'courses', courseId, 'levels'));
          const linksFromLevels: string[] = [];
          levelsSnapshot.docs.forEach(d => {
            const lvl = d.data() as any;
            if (lvl.studyMaterials && Array.isArray(lvl.studyMaterials)) {
              lvl.studyMaterials.forEach((m: any) => { if (m.url) linksFromLevels.push(m.url); });
            }
            if (lvl.detailedResources && Array.isArray(lvl.detailedResources)) {
              lvl.detailedResources.forEach((u: any) => linksFromLevels.push(u));
            }
          });
          if (linksFromLevels.length) {
            courseText += `Associated links:\n${linksFromLevels.join('\n')}\n`;
          }
        }
      } catch (err) {
        console.warn('Could not fetch course data for prompt enrichment:', err);
      }
    }

    // Build the prompt to send to the model
    const pieces = [] as string[];
    if (detailedDescription) pieces.push(`Detailed description:\n${detailedDescription}`);
    if (links && Array.isArray(links) && links.length) pieces.push(`Course links:\n${links.join('\n')}`);
    if (courseText) pieces.push(`Course data from DB:\n${courseText}`);

    const prompt = `You are an imaginative quiz designer. Using the input below, generate a creative, unpredictable quiz for a learner. Do not follow a fixed pattern — mix question types, difficulty, and formats. Output the quiz as JSON with an array "questions". Each question should include: id, type (mcq/text/truefalse/code), prompt, options (if applicable), answer (or answerKey), points, and an optional explanation. Keep the quiz engaging and surprising.\n\nInput:\n${pieces.join('\n\n')}`;

    // Call Google Generative API (text generation endpoint)
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateText?key=${apiKey}`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: { text: prompt },
        temperature: 0.7,
        // You can tune other parameters here
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Generative API error', resp.status, text);
      return NextResponse.json({ error: 'Generative API error', details: text }, { status: 502 });
    }

    const data = await resp.json();
    // The model returns text in different fields depending on model/version. Try to extract the generated text.
    const generatedText = (data?.candidates && data.candidates[0]?.content) || data?.output?.[0]?.content || data?.content || (typeof data === 'string' ? data : JSON.stringify(data));

    // Try to extract JSON from the generated text if the model returned JSON (or a code block with JSON)
    const tryExtractJSON = (text: string) => {
      if (!text) return null;

      // Attempt direct parse first
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (e) {
        // continue
      }

      // Look for ```json ... ``` blocks
      const jsonBlockMatch = text.match(/```json([\s\S]*?)```/i);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        try {
          return JSON.parse(jsonBlockMatch[1].trim());
        } catch (e) {
          // continue
        }
      }

      // Look for the first {...} object in the text that contains "questions"
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        const candidate = braceMatch[0];
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && (parsed.questions || Array.isArray(parsed))) return parsed;
        } catch (e) {
          // continue
        }
      }

      return null;
    };

    const parsed = tryExtractJSON(generatedText);

    if (parsed && (parsed.questions || Array.isArray(parsed))) {
      // Normalize shape: if model returned an array directly, wrap it
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      return NextResponse.json({ success: true, parsed: { questions }, raw: data });
    }

    // If no structured JSON was found, return the raw text and the raw model output
    return NextResponse.json({ success: false, text: generatedText, raw: data });
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
