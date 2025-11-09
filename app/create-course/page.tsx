'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUserData } from '@/lib/auth';
import { createCourse, createLevel } from '@/lib/firestore';
import { CourseCreationData, ReactFlowData, Level, CourseType } from '@/types';
import { GraphEditor } from '@/components/GraphEditor';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function CreateCoursePage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [courseData, setCourseData] = useState<Partial<CourseCreationData>>({
    title: '',
    description: '',
    detailedDescription: '',
    numberOfLevels: 1,
    type: 'public',
    graphData: { nodes: [], edges: [] },
    levels: {},
  });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const data = await getUserData(user.uid);
        setUserData(data);
      }
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleGraphDataChange = (data: ReactFlowData) => {
    setCourseData({ ...courseData, graphData: data });
  };

  const handleConfigureLevel = (nodeId: string) => {
    setSelectedNode(nodeId);
    setShowNodeModal(true);
  };

  const handleSaveLevel = (levelData: Omit<Level, 'id'>) => {
    if (!selectedNode) return;
    setCourseData({
      ...courseData,
      levels: {
        ...(courseData.levels || {}),
        [selectedNode]: levelData,
      },
    });
    setShowNodeModal(false);
    setSelectedNode(null);
  };

  const handleSubmit = async () => {
    if (!user || !courseData.title || !courseData.description || !courseData.detailedDescription || !courseData.graphData) {
      alert('Please fill in all required fields');
      return;
    }

    if (courseData.graphData.nodes.length === 0) {
      alert('Please create at least one node in the course map');
      return;
    }

    // Check if number of levels matches nodes
    if (courseData.graphData.nodes.length !== (courseData.numberOfLevels || 0)) {
      alert(`Number of levels (${courseData.numberOfLevels}) must match the number of nodes (${courseData.graphData.nodes.length})`);
      return;
    }

    // Check if all nodes have levels configured
    const nodeIds = courseData.graphData.nodes.map((n) => n.id);
    const configuredLevels = Object.keys(courseData.levels || {});
    const missingLevels = nodeIds.filter((id) => !configuredLevels.includes(id));

    if (missingLevels.length > 0) {
      alert(`Please configure levels for all nodes: ${missingLevels.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      // Create course (type will be auto-determined based on user type)
      const courseId = await createCourse(
        {
          title: courseData.title,
          description: courseData.description,
          detailedDescription: courseData.detailedDescription,
          type: 'basic' as CourseType, // Will be overridden in createCourse function
          graphData: JSON.stringify(courseData.graphData),
          creatorId: user.uid,
        },
        user.uid
      );

      // Create all levels
      for (const [levelId, levelData] of Object.entries(courseData.levels || {})) {
        await createLevel(courseId, levelId, levelData);
      }

      router.push(`/course/${courseId}`);
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Create New Course</h1>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-center space-x-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > s ? <CheckCircle className="w-6 h-6" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`h-1 w-20 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Course Details */}
      {step === 1 && (
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Introduction to Machine Learning"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description *
              </label>
              <textarea
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Brief description of the course..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                value={courseData.detailedDescription}
                onChange={(e) => setCourseData({ ...courseData, detailedDescription: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={6}
                placeholder="Provide a detailed description of the course, what students will learn, prerequisites, etc."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Levels *
              </label>
              <input
                type="number"
                min="1"
                value={courseData.numberOfLevels || 1}
                onChange={(e) => setCourseData({ ...courseData, numberOfLevels: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Each level will have 3 rounds: Study Materials, MCQ Quiz, and AI Quiz</p>
            </div>
            {userData && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Type (Auto-determined)
                </label>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    userData.userType === 'Expert' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : userData.userType === 'Architect'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {userData.userType || 'Challenger'}
                  </span>
                  <span className="text-sm text-gray-700">
                    → Your course will be tagged as: <strong className="font-semibold">
                      {userData.userType === 'Expert' 
                        ? 'Expert Course' 
                        : userData.userType === 'Architect'
                        ? 'Advanced Course'
                        : 'Basic Course'}
                    </strong>
                  </span>
                </div>
                {(!userData.userType || userData.userType === 'Challenger') && (
                  <p className="text-xs text-gray-600 mt-2">
                    Create 10+ courses to become an Architect and create Advanced courses. 
                    Request Expert status in your profile to create Expert courses.
                  </p>
                )}
              </div>
            )}
            <Button variant="primary" onClick={() => setStep(2)} className="w-full">
              Next: Create Course Map
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Graph Editor */}
      {step === 2 && (
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Map Editor</h2>
          <p className="text-gray-600 mb-4">
            Create your course structure by adding nodes and connecting them. Each node represents a level.
          </p>
          <GraphEditor
            initialData={courseData.graphData}
            onDataChange={handleGraphDataChange}
          />
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(3)}
              disabled={!courseData.graphData || courseData.graphData.nodes.length === 0}
            >
              Next: Configure Levels
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Configure Levels */}
      {step === 3 && (
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure Levels</h2>
          <p className="text-gray-600 mb-4">
            Configure the content for each level in your course. Click on a node to edit its content.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {courseData.graphData?.nodes.map((node: any) => {
              const isConfigured = courseData.levels?.[node.id];
              return (
                <div
                  key={node.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isConfigured
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-white hover:border-primary-500'
                  }`}
                  onClick={() => handleConfigureLevel(node.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{node.data.label || node.id}</h3>
                    {isConfigured ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {isConfigured ? 'Configured' : 'Click to configure'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={saving}>
              Create Course
            </Button>
          </div>
        </Card>
      )}

      {/* Level Configuration Modal */}
      <LevelConfigModal
        isOpen={showNodeModal}
        onClose={() => {
          setShowNodeModal(false);
          setSelectedNode(null);
        }}
        nodeId={selectedNode || ''}
        nodeLabel={
          courseData.graphData?.nodes.find((n: any) => n.id === selectedNode)?.data.label ||
          selectedNode ||
          ''
        }
        existingData={selectedNode ? courseData.levels?.[selectedNode] : undefined}
        onSave={handleSaveLevel}
      />
    </div>
  );
}

interface LevelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeLabel: string;
  existingData?: Omit<Level, 'id'>;
  onSave: (data: Omit<Level, 'id'>) => void;
}

const LevelConfigModal: React.FC<LevelConfigModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  nodeLabel,
  existingData,
  onSave,
}) => {
  const [title, setTitle] = useState(existingData?.title || nodeLabel);
  const [studyMaterials, setStudyMaterials] = useState(
    existingData?.studyMaterials || [{ type: 'youtube' as const, url: '', title: '' }]
  );
  const [mcqQuestions, setMcqQuestions] = useState(
    existingData?.mcqQuiz || [
      { question: '', options: ['', '', '', ''], correctIndex: 0, points: 1 },
    ]
  );
  const [passingScore, setPassingScore] = useState(existingData?.passingScore || 0);
  const [aiQuizContext, setAiQuizContext] = useState(existingData?.aiQuizContext || '');

  const handleAddStudyMaterial = () => {
    setStudyMaterials([...studyMaterials, { type: 'youtube' as const, url: '', title: '' }]);
  };

  const handleRemoveStudyMaterial = (index: number) => {
    setStudyMaterials(studyMaterials.filter((_, i) => i !== index));
  };

  const handleAddMcqQuestion = () => {
    if (mcqQuestions.length >= 40) {
      alert('Maximum 40 questions allowed');
      return;
    }
    setMcqQuestions([
      ...mcqQuestions,
      { question: '', options: ['', '', '', ''], correctIndex: 0, points: 1 },
    ]);
  };

  const handleAddOption = (qIndex: number) => {
    if (mcqQuestions[qIndex].options.length >= 6) {
      alert('Maximum 6 options per question');
      return;
    }
    const newQuestions = [...mcqQuestions];
    newQuestions[qIndex].options.push('');
    setMcqQuestions(newQuestions);
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    if (mcqQuestions[qIndex].options.length <= 4) {
      alert('Minimum 4 options required per question');
      return;
    }
    const newQuestions = [...mcqQuestions];
    const removedIndex = newQuestions[qIndex].correctIndex;
    newQuestions[qIndex].options.splice(oIndex, 1);
    // Adjust correct index if needed
    if (removedIndex >= oIndex && removedIndex > 0) {
      newQuestions[qIndex].correctIndex = removedIndex - 1;
    } else if (removedIndex === oIndex && removedIndex === newQuestions[qIndex].options.length) {
      newQuestions[qIndex].correctIndex = removedIndex - 1;
    }
    setMcqQuestions(newQuestions);
  };

  const handleRemoveMcqQuestion = (index: number) => {
    setMcqQuestions(mcqQuestions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validate title
    if (!title.trim()) {
      alert('Please enter a level title');
      return;
    }

    // Validate MCQ questions
    const validQuestions = mcqQuestions.filter((q) => q.question.trim() !== '' && q.options.some(o => o.trim() !== ''));
    
    // Minimum question count requirement removed per user request — allow any number of questions (>=0)
    if (validQuestions.length > 40) {
      alert('Maximum 40 MCQ questions allowed');
      return;
    }

    // Validate each question has 4-6 options and all options are filled
    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i];
      const filledOptions = q.options.filter(o => o.trim() !== '');
      
      if (filledOptions.length < 4 || filledOptions.length > 6) {
        alert(`Question ${i + 1} must have 4-6 filled options. Currently has ${filledOptions.length} filled option(s).`);
        return;
      }
      
      // Validate correct index is within range
      if (q.correctIndex < 0 || q.correctIndex >= filledOptions.length) {
        alert(`Question ${i + 1} has an invalid correct answer index. Please select a valid option.`);
        return;
      }
      
      // Validate points
      if (!q.points || q.points < 1) {
        alert(`Question ${i + 1} must have at least 1 point.`);
        return;
      }
    }

    // Calculate total points from valid questions
    const totalPoints = validQuestions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    if (!passingScore || passingScore < 0) {
      alert('Please enter a valid passing score (0 or greater)');
      return;
    }
    
    if (passingScore > totalPoints) {
      alert(`Passing score (${passingScore}) cannot exceed total points (${totalPoints})`);
      return;
    }

    const levelData: Omit<Level, 'id'> = {
      title: title.trim(),
      studyMaterials: studyMaterials.filter((m) => m.url.trim() !== ''),
      mcqQuiz: validQuestions.map(q => ({
        ...q,
        options: q.options.filter(o => o.trim() !== ''), // Remove empty options
      })),
      passingScore,
      aiQuizContext: aiQuizContext.trim(),
    };
    onSave(levelData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Configure Level: ${nodeLabel}`} size="xl">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Level title"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Round 1: Study Materials (Links)</label>
            <Button variant="ghost" size="sm" onClick={handleAddStudyMaterial}>
              <Plus className="w-4 h-4 mr-1" />
              Add Material
            </Button>
          </div>
          <div className="space-y-3">
            {studyMaterials.map((material, index) => (
              <div key={index} className="flex gap-2 items-start">
                <select
                  value={material.type}
                  onChange={(e) => {
                    const newMaterials = [...studyMaterials];
                    newMaterials[index].type = e.target.value as any;
                    setStudyMaterials(newMaterials);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="youtube">YouTube</option>
                  <option value="notes_link">Notes Link</option>
                  <option value="article">Article</option>
                  <option value="document">Document</option>
                </select>
                <input
                  type="text"
                  value={material.title || ''}
                  onChange={(e) => {
                    const newMaterials = [...studyMaterials];
                    newMaterials[index].title = e.target.value;
                    setStudyMaterials(newMaterials);
                  }}
                  placeholder="Title (optional)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="url"
                  value={material.url}
                  onChange={(e) => {
                    const newMaterials = [...studyMaterials];
                    newMaterials[index].url = e.target.value;
                    setStudyMaterials(newMaterials);
                  }}
                  placeholder="URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => handleRemoveStudyMaterial(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              MCQ Quiz (Round 2) - {mcqQuestions.length} / 40 questions
            </label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleAddMcqQuestion}
              disabled={mcqQuestions.length >= 40}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Question
            </Button>
          </div>
          {/* Minimum-4-questions UI warning removed per user request */}
          <div className="space-y-4">
            {mcqQuestions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Question {qIndex + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Points:</label>
                      <input
                        type="number"
                        min="1"
                        value={question.points || 1}
                        onChange={(e) => {
                          const newQuestions = [...mcqQuestions];
                          newQuestions[qIndex].points = parseInt(e.target.value) || 1;
                          setMcqQuestions(newQuestions);
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {question.options.length < 6 && (
                      <button
                        onClick={() => handleAddOption(qIndex)}
                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                      >
                        + Option
                      </button>
                    )}
                    {question.options.length > 4 && (
                      <button
                        onClick={() => {
                          if (question.options.length > 4) {
                            const lastIndex = question.options.length - 1;
                            handleRemoveOption(qIndex, lastIndex);
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                      >
                        - Option
                      </button>
                    )}
                    {mcqQuestions.length > 1 && (
                      <button
                        onClick={() => handleRemoveMcqQuestion(qIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => {
                    const newQuestions = [...mcqQuestions];
                    newQuestions[qIndex].question = e.target.value;
                    setMcqQuestions(newQuestions);
                  }}
                  placeholder="Question text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                />
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={question.correctIndex === oIndex}
                        onChange={() => {
                          const newQuestions = [...mcqQuestions];
                          newQuestions[qIndex].correctIndex = oIndex;
                          setMcqQuestions(newQuestions);
                        }}
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newQuestions = [...mcqQuestions];
                          newQuestions[qIndex].options[oIndex] = e.target.value;
                          setMcqQuestions(newQuestions);
                        }}
                        placeholder={`Option ${oIndex + 1}${question.correctIndex === oIndex ? ' (Correct)' : ''}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      {question.correctIndex === oIndex && (
                        <span className="text-xs text-green-600 font-semibold">✓ Correct</span>
                      )}
                      {question.options.length > 4 && (
                        <button
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Passing Score for this Level *
              </label>
              <span className="text-xs text-gray-500">
                Total Points: {mcqQuestions.reduce((sum, q) => sum + (q.points || 1), 0)}
              </span>
            </div>
            <input
              type="number"
              min="0"
              max={mcqQuestions.reduce((sum, q) => sum + (q.points || 1), 0)}
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Minimum score to pass"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Students must score at least {passingScore} points to pass this level and proceed to the next.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI Quiz Context (Round 3 - For Future Implementation)
          </label>
          <textarea
            value={aiQuizContext}
            onChange={(e) => setAiQuizContext(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={6}
            placeholder="Provide a detailed description of this level's content. The AI will use this to generate questions for the AI Challenge round (coming in next version)."
          />
          <p className="text-xs text-gray-500 mt-1">
            This context will be used by the AI in future versions to generate questions. You can leave this blank for now.
          </p>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">
            Save Level
          </Button>
        </div>
      </div>
    </Modal>
  );
};

