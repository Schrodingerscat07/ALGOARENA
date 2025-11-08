'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getCourse, getUserProgress } from '@/lib/firestore';
import { Course, CourseProgress, ReactFlowData } from '@/types';
import { CourseMap } from '@/components/CourseMap';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, BookOpen, Edit3 } from 'lucide-react';
import Link from 'next/link';

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [user] = useAuthState(auth);
  const [course, setCourse] = useState<Course | null>(null);
  const [userProgress, setUserProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseData = await getCourse(courseId);
        if (!courseData) {
          router.push('/');
          return;
        }
        setCourse(courseData);

        if (user) {
          const progress = await getUserProgress(user.uid, courseId);
          setUserProgress(progress);
        }
      } catch (error) {
        console.error('Error loading course:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [courseId, user, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <p className="text-center text-gray-600">Course not found</p>
          <Link href="/">
            <Button variant="primary" className="mt-4">
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  let graphData: ReactFlowData;
  try {
    graphData = JSON.parse(course.graphData);
  } catch (error) {
    console.error('Error parsing graph data:', error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <p className="text-center text-red-600">Error loading course map</p>
        </Card>
      </div>
    );
  }

  const completedCount = userProgress?.completedNodes.length || 0;
  const totalNodes = graphData.nodes.length;
  const progressPercentage = totalNodes > 0 ? (completedCount / totalNodes) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-lg text-gray-600">{course.description}</p>
          </div>
          {user && course.creatorId === user.uid && (
            <Link href={`/course/${courseId}/edit`}>
              <Button variant="primary" className="inline-flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Edit Course
              </Button>
            </Link>
          )}
        </div>

        {user && (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-primary-600">
                {completedCount} / {totalNodes} levels completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </Card>
        )}

        {!user && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Sign in to track your progress</p>
                <p className="text-sm text-blue-700">Create an account to unlock levels and save your learning journey</p>
              </div>
              <Link href="/signup" className="ml-auto">
                <Button variant="primary">Sign Up</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Map</h2>
        <CourseMap
          graphData={graphData}
          userProgress={userProgress}
          courseId={courseId}
        />
        <div className="mt-6 flex gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span>Locked</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

