'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getLevel, updateUserProgress, getCourse } from '@/lib/firestore';
import { Level, ReactFlowData } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, CheckCircle, Lock, Youtube, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import YouTube from 'react-youtube';

interface AiQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

const QuizQuestion = ({ questions, currentIndex, answers, setAnswers, onPrev, onNext, onSubmit, isGrading }: {
  questions: AiQuestion[];
  currentIndex: number;
  answers: Record<number, number>;
  setAnswers: (answers: Record<number, number>) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isGrading: boolean;
}) => {
  const q = questions[currentIndex];
  if (!q) return null;

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Question {currentIndex + 1} of {questions.length}
        </h3>
        <p className="text-lg mb-6">{q.question}</p>
        <div className="space-y-3">
          {q.options.map((option, index) => (
            <label
              key={index}
              className={
                "flex items-center p-4 rounded-lg cursor-pointer transition-colors " +
                (answers[currentIndex] === index
                  ? "bg-primary-100 border-2 border-primary-500"
                  : "bg-gray-50 border-2 border-transparent hover:bg-gray-100")
              }
            >
              <input
                type="radio"
                name={"question-" + currentIndex}
                value={index}
                checked={answers[currentIndex] === index}
                onChange={() => setAnswers({ ...answers, [currentIndex]: index })}
                className="sr-only"
              />
              <span className="ml-2">{option}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={onPrev} disabled={currentIndex === 0}>Previous</Button>
          <span className="text-sm text-gray-500">{currentIndex + 1} of {questions.length}</span>
          <Button variant="outline" onClick={onNext} disabled={currentIndex === questions.length - 1}>Next</Button>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <Button variant="primary" onClick={onSubmit} disabled={isGrading || Object.keys(answers).length !== questions.length}>
          {isGrading ? "Grading..." : "Submit Quiz"}
        </Button>
      </div>
    </div>
  );
};


export default function LevelPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const levelId = params.levelId as string;
  const [user] = useAuthState(auth);
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState<'learn' | 'mcq' | 'ai'>('learn');
  const [learnComplete, setLearnComplete] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<number[]>([]);
  const [mcqScore, setMcqScore] = useState<number | null>(null);
  const [mcqPassed, setMcqPassed] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  // AI Challenge state
  const [aiQuestions, setAiQuestions] = useState<AiQuestion[]>([]);
  const [currentAiIndex, setCurrentAiIndex] = useState(0);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiAnswers, setAiAnswers] = useState<Record<number, number>>({});
  const [aiResult, setAiResult] = useState<{
    score: number;
    passed: boolean;
    feedback: string;
  } | null>(null);
  const [aiGrading, setAiGrading] = useState(false);

  useEffect(() => {
    const loadLevel = async () => {
      try {
        const levelData = await getLevel(courseId, levelId);
        if (!levelData) {
          router.push(`/course/${courseId}`);
          return;
        }
        setLevel(levelData);
      } catch (error) {
        console.error('Error loading level:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLevel();
  }, [courseId, levelId, router]);

  const handleLearnComplete = async () => {
    setLearnComplete(true);
    if (level?.mcqQuiz) {
      setRound('mcq');
    } else if (user) {
      // If no MCQ quiz, complete the level directly
      try {
        const course = await getCourse(courseId);
        if (course) {
          const graphData: ReactFlowData = JSON.parse(course.graphData);
          await updateUserProgress(user.uid, courseId, levelId, graphData);
          setShowCompleteModal(true);
        }
      } catch (error) {
        console.error('Error updating progress:', error);
        alert('Failed to update progress. Please try again.');
      }
    }
  };

  const handleMcqSubmit = async () => {
    if (!level?.mcqQuiz) return;
    let correct = 0;
    level.mcqQuiz.forEach((question, index) => {
      if (mcqAnswers[index] === question.correctIndex) {
        correct++;
      }
    });
    const score = (correct / level.mcqQuiz.length) * 100;
    setMcqScore(score);
    const passed = score >= (level.passingScore || 80);
    setMcqPassed(passed);
    
    if (passed && user) {
      try {
        const course = await getCourse(courseId);
        if (course) {
          const graphData: ReactFlowData = JSON.parse(course.graphData);
          await updateUserProgress(user.uid, courseId, levelId, graphData);
          setShowCompleteModal(true);
        }
      } catch (error) {
        console.error('Error updating progress:', error);
        alert('Failed to update progress. Please try again.');
      }
    }
  };

  const gradeAiAnswers = async () => {
    setAiGrading(true);
    try {
      const total = aiQuestions.length;
      if (total === 0) {
        setAiResult({ score: 0, passed: false, feedback: 'No questions to grade.' });
        return;
      }

      let correct = 0;
      aiQuestions.forEach((q, index) => {
        if (aiAnswers[index] === q.correctAnswer) {
          correct++;
        }
      });

      const score = Math.round((correct / total) * 100);
      const passed = score >= (level?.passingScore || 80);
      setAiResult({ 
        score, 
        passed, 
        feedback: passed 
          ? 'Great job! You\'ve demonstrated a solid understanding of the concepts.' 
          : 'Keep practicing! Review the material and try again.' 
      });

      if (passed && user) {
        try {
          const course = await getCourse(courseId);
          if (course) {
            const graphData: ReactFlowData = JSON.parse(course.graphData);
            await updateUserProgress(user.uid, courseId, levelId, graphData);
            setShowCompleteModal(true);
          }
        } catch (error) {
          console.error('Error updating progress after AI grading:', error);
        }
      }
    } catch (error) {
      console.error('Error grading AI answers:', error);
      alert('Failed to grade AI answers. Please try again.');
    } finally {
      setAiGrading(false);
    }
  };

  const generateAiChallenge = async () => {
    setGeneratingAi(true);
    try {
      // Check if the API is configured first
      const statusRes = await fetch('/api/gemini/status');
      const statusJson = await statusRes.json();
      
      if (!statusJson.present) {
        alert('AI service is not configured. Please contact your administrator to set up the API key.');
        return;
      }
      
      const lvl = level!; // we've checked loading earlier; assert non-null
      const links = (lvl.studyMaterials || []).filter((m: any) => m.url).map((m: any) => m.url);
      const payload = {
        topic: lvl.title,
        concept: lvl.aiQuizContext || '',
        numQuestions: 3,
      };

      const res = await fetch('/api/ai-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        const errorMessage = json.error || 'Unknown error occurred';
        console.error('Quiz generation error:', errorMessage);
        
        if (res.status === 503) {
          alert('AI service is not properly configured. Please contact support.');
        } else if (res.status === 400) {
          alert('Invalid request. Please try again with proper topic and concept.');
        } else {
          alert(`Failed to generate quiz: ${errorMessage}`);
        }
        return;
      }

      if (json.questions && Array.isArray(json.questions) && json.questions.length > 0) {
        setAiQuestions(json.questions);
        setCurrentAiIndex(0);
        setRound('ai');
      } else {
        console.error('Invalid response format:', json);
        alert('Failed to generate valid questions. Please try again.');
      }

      setCurrentAiIndex(0);
      setRound('ai');
    } catch (error) {
      console.error('Error calling AI endpoint:', error);
      alert('Failed to call AI endpoint. Check server logs and API key.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const markLevelCompleteManually = async () => {
    if (!user) return alert('You must be signed in to mark complete');
    try {
      const course = await getCourse(courseId);
      if (!course) return;
      const graphData: ReactFlowData = JSON.parse(course.graphData);
      await updateUserProgress(user.uid, courseId, levelId, graphData);
      setShowCompleteModal(true);
    } catch (err) {
      console.error('Error marking level complete:', err);
      alert('Failed to mark level complete');
    }
  };

  if (loading || !level) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href={`/course/${courseId}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course Map
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{level.title}</h1>
        <div className="flex gap-4 mt-4">
          <Button
            variant={round === 'learn' ? 'primary' : learnComplete ? 'secondary' : 'outline'}
            onClick={() => setRound('learn')}
            disabled={false}
          >
            {learnComplete ? <CheckCircle className="w-4 h-4 mr-2" /> : null}
            Study Materials
          </Button>
          {level.mcqQuiz && (
            <Button
              variant={round === 'mcq' ? 'primary' : mcqPassed ? 'secondary' : 'outline'}
              onClick={() => learnComplete && setRound('mcq')}
              disabled={!learnComplete}
            >
              {mcqPassed ? <CheckCircle className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Practice Quiz
            </Button>
          )}
          {/* Generate AI challenge button */}
          <Button
            variant={round === 'ai' ? 'primary' : 'outline'}
            onClick={generateAiChallenge}
            disabled={generatingAi}
          >
            {generatingAi ? 'Generating...' : 'Generate AI Challenge'}
          </Button>
        </div>
      </div>

      {/* Round 1: Learn */}
      {round === 'learn' && (
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Study Materials</h2>
          <div className="space-y-6">
            {level.studyMaterials.map((material, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {material.type === 'youtube' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-600" />
                      {material.title || 'Video Lesson'}
                    </h3>
                    <div className="aspect-video">
                      <YouTube
                        videoId={material.url.split('v=')[1]?.split('&')[0] || material.url.split('/').pop()}
                        opts={{
                          width: '100%',
                          height: '100%',
                          playerVars: { autoplay: 0 },
                        }}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}
                {(material.type === 'notes_link' || material.type === 'article' || material.type === 'document') && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{material.title || 'Study Material'}</h3>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Resource
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button variant="primary" className="mt-6" onClick={handleLearnComplete}>
            Mark as Complete & Continue
          </Button>
        </Card>
      )}

      {/* Optional MCQ Quiz */}
      {round === 'mcq' && level.mcqQuiz && (
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Practice Quiz</h2>
          <div className="space-y-6">
            {level.mcqQuiz.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {qIndex + 1}. {question.question}
                </h3>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <label
                      key={oIndex}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        mcqAnswers[qIndex] === oIndex
                          ? 'bg-primary-100 border-2 border-primary-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={oIndex}
                        checked={mcqAnswers[qIndex] === oIndex}
                        onChange={() => {
                          const newAnswers = [...mcqAnswers];
                          newAnswers[qIndex] = oIndex;
                          setMcqAnswers(newAnswers);
                        }}
                        className="mr-3"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {mcqScore !== null && (
            <div className={`mt-6 p-4 rounded-lg ${mcqPassed ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-semibold ${mcqPassed ? 'text-green-800' : 'text-red-800'}`}>
                Your Score: {mcqScore.toFixed(1)}% {mcqPassed ? '✓ Passed!' : '✗ Failed (Need 80% to pass)'}
              </p>
            </div>
          )}
          <Button
            variant="primary"
            className="mt-6"
            onClick={handleMcqSubmit}
            disabled={mcqAnswers.length !== level.mcqQuiz.length}
          >
            Submit Quiz
          </Button>
        </Card>
      )}

      {/* Round 3: AI Challenge */}
      {round === 'ai' && (
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Challenge</h2>

          {/* No questions yet (either generating or user hasn't generated) */}
          {aiQuestions.length === 0 ? (
            <div className="text-center py-8">
              {generatingAi ? (
                <>
                  <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating AI questions...</p>
                </>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">No AI challenge generated yet. Click "Generate AI Challenge" to start.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Show one question at a time */}
              <QuizQuestion
                questions={aiQuestions}
                currentIndex={currentAiIndex}
                answers={aiAnswers}
                setAnswers={setAiAnswers}
                onPrev={() => setCurrentAiIndex(i => Math.max(0, i - 1))}
                onNext={() => setCurrentAiIndex(i => Math.min(aiQuestions.length - 1, i + 1))}
                onSubmit={gradeAiAnswers}
                isGrading={aiGrading}
              />

              {aiResult && (
                <div className={`mb-6 p-6 rounded-lg ${aiResult.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`font-bold text-lg mb-2 ${aiResult.passed ? 'text-green-800' : 'text-red-800'}`}>
                    Score: {aiResult.score}% {aiResult.passed ? '✓ Passed!' : '✗ Failed'}
                  </p>
                  <p className="text-gray-700">{aiResult.feedback}</p>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Level Complete Modal */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Level Complete! 🎉">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700 mb-6">
            Congratulations! You've completed this level. Ready to tackle the next challenge?
          </p>
          <Link href={`/course/${courseId}`}>
            <Button variant="primary">Back to Course Map</Button>
          </Link>
        </div>
      </Modal>
    </div>
  );
}

