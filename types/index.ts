import { Node, Edge } from 'reactflow';

export type UserRole = 'student' | 'creator' | 'admin';
export type CourseType = 'platform_official' | 'certified_creator' | 'public';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  progress: Record<string, CourseProgress>;
}

export interface CourseProgress {
  completedNodes: string[];
  currentNode: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  type: CourseType;
  graphData: string; // JSON stringified ReactFlow data
}

export interface Level {
  id: string; // Must match nodeId from graphData
  title: string;
  studyMaterials: StudyMaterial[];
  mcqQuiz: MCQQuestion[];
  aiQuizContext: string;
}

export interface StudyMaterial {
  type: 'youtube' | 'notes_link' | 'article' | 'document';
  url: string;
  title?: string;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ReactFlowData {
  nodes: Node[];
  edges: Edge[];
}

export interface AIQuizResult {
  score: number;
  feedback: string;
  passed: boolean;
}

export interface CourseCreationData {
  title: string;
  description: string;
  type: CourseType;
  graphData: ReactFlowData;
  levels: Record<string, Omit<Level, 'id'>>;
}

