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
import { Course, Level, User, CourseProgress, ReactFlowData, UserRole, UserType, CourseType } from '@/types';

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

// Calculate user type based on course count
export const calculateUserType = (courseCount: number, isExpert: boolean = false): UserType => {
  if (isExpert) return 'Expert';
  if (courseCount >= 10) return 'Architect';
  return 'Challenger';
};

// Get user's course count
export const getUserCourseCount = async (userId: string): Promise<number> => {
  const q = query(collection(db, 'courses'), where('creatorId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Update user's course count and type
export const updateUserCourseCount = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;
  
  const courseCount = await getUserCourseCount(userId);
  const userData = userDoc.data() as User;
  // Check if user is marked as Expert (set by admin)
  const isExpert = userData.userType === 'Expert';
  const userType = calculateUserType(courseCount, isExpert);
  
  await updateDoc(userRef, {
    courseCount,
    userType,
  });
};

export const createCourse = async (courseData: Omit<Course, 'id'>, creatorId: string): Promise<string> => {
  // Get creator's user type before creating course
  const userRef = doc(db, 'users', creatorId);
  const userDoc = await getDoc(userRef);
  let creatorType: UserType | undefined = 'Challenger';
  let courseType: CourseType = 'basic'; // Default to basic
  
  if (userDoc.exists()) {
    const userData = userDoc.data() as User;
    creatorType = userData.userType || 'Challenger';
    
    // Set course type based on user type
    if (creatorType === 'Expert') {
      courseType = 'expert';
    } else if (creatorType === 'Architect') {
      courseType = 'advanced';
    } else {
      courseType = 'basic';
    }
  }
  
  const courseRef = doc(collection(db, 'courses'));
  await setDoc(courseRef, {
    ...courseData,
    type: courseType, // Override with user-type-based course type
    creatorId,
    creatorType,
    createdAt: serverTimestamp(),
  });
  
  // Update creator's course count
  await updateUserCourseCount(creatorId);
  
  return courseRef.id;
};

export const updateCourse = async (
  courseId: string,
  updates: Partial<Omit<Course, 'id' | 'creatorId'>>
): Promise<void> => {
  const courseRef = doc(db, 'courses', courseId);
  await updateDoc(courseRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
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

// Enroll in a course
export const enrollInCourse = async (userId: string, courseId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const progress: CourseProgress = {
    completedNodes: [],
    currentNode: null,
    enrolled: true,
    startedAt: Timestamp.now(),
    lastAccessedAt: Timestamp.now(),
    levelsCompleted: 0,
    totalLevels: 0, // Will be updated when first accessing a level
  };

  await updateDoc(userRef, {
    [`progress.${courseId}`]: progress,
  });
};

// Update course rating
export const updateCourseRating = async (
  userId: string,
  courseId: string,
  rating: number,
  review?: string
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data() as User;
  const currentProgress = userData.progress[courseId];
  
  if (!currentProgress || !currentProgress.enrolled) {
    throw new Error('User is not enrolled in this course');
  }

  const updatedProgress: CourseProgress = {
    ...currentProgress,
    rating,
    review,
  };

  await updateDoc(userRef, {
    [`progress.${courseId}`]: updatedProgress,
  });
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
    enrolled: true,
    startedAt: Timestamp.now(),
    lastAccessedAt: Timestamp.now(),
    levelsCompleted: 0,
    totalLevels: graphData.nodes.length,
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
    enrolled: true,
    lastAccessedAt: Timestamp.now(),
  };
  
  await updateDoc(userRef, {
    [`progress.${courseId}`]: updatedProgress,
  });
};

