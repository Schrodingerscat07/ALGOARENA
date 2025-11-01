import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Course, Level, User, CourseProgress, ReactFlowData } from '@/types';

// Courses
export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (courseDoc.exists()) {
      return { id: courseDoc.id, ...courseDoc.data() } as Course;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching course:', error);
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      throw new Error(
        'Firestore is not available. Please make sure:\n' +
        '1. Firestore Database is enabled in Firebase Console\n' +
        '2. You have an active internet connection\n' +
        '3. Firestore rules allow access'
      );
    }
    throw error;
  }
};

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    return coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      throw new Error(
        'Firestore is not available. Please make sure:\n' +
        '1. Firestore Database is enabled in Firebase Console\n' +
        '2. You have an active internet connection\n' +
        '3. Firestore rules allow access'
      );
    }
    throw error;
  }
};

export const getCoursesByType = async (type: string): Promise<Course[]> => {
  const q = query(collection(db, 'courses'), where('type', '==', type));
  const coursesSnapshot = await getDocs(q);
  return coursesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Course[];
};

export const createCourse = async (courseData: Omit<Course, 'id'>, creatorId: string): Promise<string> => {
  const courseRef = doc(collection(db, 'courses'));
  await setDoc(courseRef, {
    ...courseData,
    creatorId,
    createdAt: serverTimestamp(),
  });
  return courseRef.id;
};

// Levels
export const getLevel = async (courseId: string, levelId: string): Promise<Level | null> => {
  const levelDoc = await getDoc(doc(db, 'courses', courseId, 'levels', levelId));
  if (levelDoc.exists()) {
    return { id: levelDoc.id, ...levelDoc.data() } as Level;
  }
  return null;
};

export const getAllLevels = async (courseId: string): Promise<Level[]> => {
  const levelsSnapshot = await getDocs(collection(db, 'courses', courseId, 'levels'));
  return levelsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Level[];
};

export const createLevel = async (
  courseId: string,
  levelId: string,
  levelData: Omit<Level, 'id'>
): Promise<void> => {
  await setDoc(doc(db, 'courses', courseId, 'levels', levelId), levelData);
};

// User Progress
export const getUserProgress = async (userId: string, courseId: string): Promise<CourseProgress | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    const userData = userDoc.data() as User;
    return userData.progress[courseId] || null;
  }
  return null;
};

export const updateUserProgress = async (
  userId: string,
  courseId: string,
  levelId: string,
  graphData: ReactFlowData
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data() as User;
  const currentProgress = userData.progress[courseId] || {
    completedNodes: [],
    currentNode: null,
  };
  
  // Add levelId to completed nodes if not already there
  const updatedCompletedNodes = currentProgress.completedNodes.includes(levelId)
    ? currentProgress.completedNodes
    : [...currentProgress.completedNodes, levelId];
  
  // Find next unlocked nodes from graphData
  const completedNodeIds = new Set(updatedCompletedNodes);
  const nextNodes: string[] = [];
  
  graphData.edges.forEach(edge => {
    if (completedNodeIds.has(edge.source) && !completedNodeIds.has(edge.target)) {
      // Check if all prerequisites for target are completed
      const targetPrerequisites = graphData.edges
        .filter(e => e.target === edge.target)
        .map(e => e.source);
      
      if (targetPrerequisites.every(prereq => completedNodeIds.has(prereq))) {
        nextNodes.push(edge.target);
      }
    }
  });
  
  // If no next nodes found, check for nodes with no prerequisites
  if (nextNodes.length === 0) {
    const allNodeIds = new Set(graphData.nodes.map(n => n.id));
    const nodesWithPrerequisites = new Set(
      graphData.edges.map(e => e.target)
    );
    const rootNodes = graphData.nodes.filter(
      n => !nodesWithPrerequisites.has(n.id) && !completedNodeIds.has(n.id)
    );
    nextNodes.push(...rootNodes.map(n => n.id));
  }
  
  const updatedProgress: CourseProgress = {
    completedNodes: updatedCompletedNodes,
    currentNode: nextNodes[0] || null,
  };
  
  await updateDoc(userRef, {
    [`progress.${courseId}`]: updatedProgress,
  });
};

