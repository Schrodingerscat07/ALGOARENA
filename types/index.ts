import { Node, Edge } from 'reactflow';

export type UserRole = 'student' | 'creator' | 'admin';
export type UserType = 'Expert' | 'Challenger' | 'Architect'; // Based on course count
export type CourseType = 'platform_official' | 'expert' | 'basic' | 'advanced' | 'certified_creator' | 'public';

export interface User {
  id: string;
  email: string;
  displayName: string;
  description?: string; // User profile description
  role: UserRole;
  userType?: UserType; // Calculated based on course count, default 'Challenger'
  courseCount?: number; // Number of courses created
  expertRequestSent?: boolean; // Whether user has requested Expert status
  progress: Record<string, CourseProgress>;
}

import { Timestamp } from 'firebase/firestore';

export interface CourseProgress {
  completedNodes: string[];
  currentNode: string | null;
  enrolled: boolean;
  startedAt?: Timestamp;
  lastAccessedAt?: Timestamp;
  completedAt?: Timestamp;
  score?: number;         // Overall course score
  timeSpent?: number;     // Total time spent in minutes
  levelsCompleted?: number;
  totalLevels?: number;
  rating?: number;        // User rating for the course (1-5)
  review?: string;        // User review/comment
}

export interface Course {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string; // Detailed description for course creation
  creatorId: string;
  creatorType?: UserType; // Type of user who created the course
  type: CourseType;
  graphData: string; // JSON stringified ReactFlow data
}

export interface Level {
  id: string; // Must match nodeId from graphData
  title: string;
  studyMaterials: StudyMaterial[]; // Round 1
  mcqQuiz?: MCQQuestion[]; // Round 2 (optional)
  passingScore?: number; // Minimum score needed to pass this level
}

export interface StudyMaterial {
  type: 'youtube' | 'notes_link' | 'article' | 'document';
  url: string;
  title?: string;
}

export interface MCQQuestion {
  question: string;
  options: string[]; // 4-6 options
  correctIndex: number;
  points: number; // Points assigned to this question
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
  detailedDescription: string; // Detailed description required
  numberOfLevels: number; // User specifies number of levels
  type: CourseType;
  graphData: ReactFlowData;
  levels: Record<string, Omit<Level, 'id'>>;
}

