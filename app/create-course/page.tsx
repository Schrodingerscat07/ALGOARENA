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
  const [step, setStep] = useState(1);
  const [courseData, setCourseData] = useState<Partial<CourseCreationData>>({
    title: '',
    description: '',
    type: 'public',
    graphData: { nodes: [], edges: [] },
    levels: {},
  });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      const userData = await getUserData(user.uid);
      if (userData?.role !== 'creator' && userData?.role !== 'admin') {
        router.push('/');
      }
    };
    checkAccess();
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
    if (!user || !courseData.title || !courseData.description || !courseData.graphData) {
      alert('Please fill in all required fields');
      return;
    }

    if (courseData.graphData.nodes.length === 0) {
      alert('Please create at least one node in the course map');
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
      // Create course
      const courseId = await createCourse(
        {
          title: courseData.title,
          description: courseData.description,
          type: courseData.type as CourseType,
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
                Description *
              </label>
              <textarea
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                placeholder="Describe what students will learn in this course..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Type *
              </label>
              <select
                value={courseData.type}
                onChange={(e) =>
                  setCourseData({ ...courseData, type: e.target.value as CourseType })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="public">Public</option>
                <option value="certified_creator">Certified Creator</option>
              </select>
            </div>
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
      { question: '', options: ['', '', '', ''], correctIndex: 0 },
    ]
  );
  const [aiQuizContext, setAiQuizContext] = useState(existingData?.aiQuizContext || '');

  const handleAddStudyMaterial = () => {
    setStudyMaterials([...studyMaterials, { type: 'youtube' as const, url: '', title: '' }]);
  };

  const handleRemoveStudyMaterial = (index: number) => {
    setStudyMaterials(studyMaterials.filter((_, i) => i !== index));
  };

  const handleAddMcqQuestion = () => {
    setMcqQuestions([
      ...mcqQuestions,
      { question: '', options: ['', '', '', ''], correctIndex: 0 },
    ]);
  };

  const handleRemoveMcqQuestion = (index: number) => {
    setMcqQuestions(mcqQuestions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const levelData: Omit<Level, 'id'> = {
      title,
      studyMaterials: studyMaterials.filter((m) => m.url.trim() !== ''),
      mcqQuiz: mcqQuestions.filter((q) => q.question.trim() !== ''),
      aiQuizContext,
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
            <label className="block text-sm font-medium text-gray-700">Study Materials</label>
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
            <label className="block text-sm font-medium text-gray-700">MCQ Quiz</label>
            <Button variant="ghost" size="sm" onClick={handleAddMcqQuestion}>
              <Plus className="w-4 h-4 mr-1" />
              Add Question
            </Button>
          </div>
          <div className="space-y-4">
            {mcqQuestions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Question {qIndex + 1}</span>
                  <button
                    onClick={() => handleRemoveMcqQuestion(qIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI Quiz Context *
          </label>
          <textarea
            value={aiQuizContext}
            onChange={(e) => setAiQuizContext(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={6}
            placeholder="Provide a detailed description of this level's content. The AI will use this to generate questions for the AI Challenge round."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This context will be used by the AI to generate questions. Be detailed and comprehensive.
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

