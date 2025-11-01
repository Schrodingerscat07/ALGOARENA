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

const httpsCallable = async (functionName: string, data: any) => {
  const response = await fetch(`/api/functions/${functionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Function call failed: ${response.statusText}`);
  }
  return response.json();
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
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<number, string>>({});
  const [aiGrading, setAiGrading] = useState(false);
  const [aiResult, setAiResult] = useState<{ score: number; feedback: string; passed: boolean } | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

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

  const handleLearnComplete = () => {
    setLearnComplete(true);
    setRound('mcq');
  };

  const handleMcqSubmit = () => {
    if (!level) return;
    let correct = 0;
    level.mcqQuiz.forEach((question, index) => {
      if (mcqAnswers[index] === question.correctIndex) {
        correct++;
      }
    });
    const score = (correct / level.mcqQuiz.length) * 100;
    setMcqScore(score);
    const passed = score >= 80;
    setMcqPassed(passed);
    if (passed) {
      setRound('ai');
    }
  };

  const generateAiQuestions = async () => {
    if (!level) return;
    try {
      const result = await httpsCallable('generateAiQuestions', {
        context: level.aiQuizContext,
      });
      setAiQuestions(result.questions || []);
    } catch (error) {
      console.error('Error generating AI questions:', error);
      alert('Failed to generate AI questions. Please try again.');
    }
  };

  const gradeAiAnswers = async () => {
    if (!level || aiQuestions.length === 0) return;
    setAiGrading(true);
    try {
      const answers = aiQuestions.map((_, index) => aiAnswers[index] || '');
      const result = await httpsCallable('gradeAiAnswers', {
        context: level.aiQuizContext,
        questions: aiQuestions,
        answers: answers,
      });
      setAiResult(result);
      
      if (result.passed && user) {
        // Update user progress
        const course = await getCourse(courseId);
        if (course) {
          const graphData: ReactFlowData = JSON.parse(course.graphData);
          await updateUserProgress(user.uid, courseId, levelId, graphData);
        }
        setShowCompleteModal(true);
      }
    } catch (error) {
      console.error('Error grading AI answers:', error);
      alert('Failed to grade answers. Please try again.');
    } finally {
      setAiGrading(false);
    }
  };

  useEffect(() => {
    if (round === 'ai' && aiQuestions.length === 0) {
      generateAiQuestions();
    }
  }, [round]);

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
            {learnComplete ? <CheckCircle className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            Round 1: Learn
          </Button>
          <Button
            variant={round === 'mcq' ? 'primary' : mcqPassed ? 'secondary' : 'outline'}
            onClick={() => learnComplete && setRound('mcq')}
            disabled={!learnComplete}
          >
            {mcqPassed ? <CheckCircle className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            Round 2: Quiz
          </Button>
          <Button
            variant={round === 'ai' ? 'primary' : mcqPassed ? 'outline' : 'outline'}
            onClick={() => mcqPassed && setRound('ai')}
            disabled={!mcqPassed}
          >
            {aiResult?.passed ? <CheckCircle className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            Round 3: AI Challenge
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

      {/* Round 2: MCQ Quiz */}
      {round === 'mcq' && (
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Creator Quiz</h2>
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
          {aiQuestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Generating AI questions...</p>
            </div>
          ) : (
            <>
              <div className="space-y-6 mb-6">
                {aiQuestions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {index + 1}. {question}
                    </h3>
                    <textarea
                      value={aiAnswers[index] || ''}
                      onChange={(e) => {
                        setAiAnswers({ ...aiAnswers, [index]: e.target.value });
                      }}
                      className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Type your answer here..."
                    />
                  </div>
                ))}
              </div>
              {aiResult && (
                <div className={`mb-6 p-6 rounded-lg ${aiResult.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`font-bold text-lg mb-2 ${aiResult.passed ? 'text-green-800' : 'text-red-800'}`}>
                    Score: {aiResult.score}% {aiResult.passed ? '✓ Passed!' : '✗ Failed'}
                  </p>
                  <p className="text-gray-700">{aiResult.feedback}</p>
                </div>
              )}
              <Button
                variant="primary"
                onClick={gradeAiAnswers}
                disabled={aiGrading || Object.keys(aiAnswers).length !== aiQuestions.length}
                isLoading={aiGrading}
              >
                Submit for AI Grading
              </Button>
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

