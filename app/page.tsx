'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getAllCourses } from '@/lib/firestore';
import { Course } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, ArrowRight, Star, Plus } from 'lucide-react';

export default function HomePage() {
  const [user] = useAuthState(auth);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const allCourses = await getAllCourses();
        setCourses(allCourses);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  const platformOfficial = courses.filter((c) => c.type === 'platform_official');

  return (
    <div className="w-full px-0 py-12">
      {/* Hero Section */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8 w-full">
          {/* Left pixel-art or icon */}
          <div className="hidden md:flex flex-1 justify-center">
            <span className="text-6xl" role="img" aria-label="game icon">🎮</span>
          </div>
          {/* Centered, expanded text */}
          <div className="flex-[2] text-center w-full">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4 w-full">
              <div className="flex flex-col items-center space-y-1 w-full">
                <span className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-game-accent1 via-primary-400 to-game-accent2 bg-clip-text text-transparent w-full block tracking-tight">
                  Master <span className="text-game-accent2">Skills</span><span className="text-primary-400">Through</span>
                </span>
                <span className="text-2xl md:text-4xl font-bold text-game-highlight w-full block">
                  Interactive Learning
                </span>
                <span className="text-lg md:text-2xl text-game-text w-full block">
                  Navigate skill trees, unlock levels, and test your knowledge with AI-powered quizzes.
                </span>
                <span className="text-lg md:text-2xl text-game-text w-full block">
                  Your learning journey, gamified.
                </span>
                <span className="h-2"></span>
              </div>
            </h1>
          </div>
          {/* Right pixel-art or icon */}
          <div className="hidden md:flex flex-1 justify-center">
            <span className="text-6xl" role="img" aria-label="trophy">🏆</span>
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="mb-8 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-4xl font-extrabold text-game-accent1 animate-glow drop-shadow-[0_0_10px_#7A3BB3]">
              Platform Official Courses
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {platformOfficial.map((course) => (
              <Card key={course.id} hover>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="px-2 py-1 text-xs font-semibold text-primary-700 bg-primary-100 rounded">
                      PLATFORM (EXCLUSIVE)
                    </span>
                    {course.creatorType && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        course.creatorType === 'Expert' 
                          ? 'text-yellow-700 bg-yellow-100' 
                          : course.creatorType === 'Architect'
                          ? 'text-purple-700 bg-purple-100'
                          : 'text-blue-700 bg-blue-100'
                      }`}>
                        {course.creatorType}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 flex-grow">{course.description}</p>
                  <Link href={`/course/${course.id}`}>
                    <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                      Start Learning
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {courses.filter((c) => c.type !== 'platform_official').length > 0 && (
            <>
              <h2 className="text-4xl font-extrabold text-game-accent2 animate-pulse mb-6 drop-shadow-[0_0_10px_#41A6F6]">
                All Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter((c) => c.type !== 'platform_official')
                  .map((course) => (
                    <Card key={course.id} hover>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <span className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded">
                            {course.type.replace('_', ' ').toUpperCase()}
                          </span>
                          {course.creatorType && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              course.creatorType === 'Expert' 
                                ? 'text-yellow-700 bg-yellow-100' 
                                : course.creatorType === 'Architect'
                                ? 'text-purple-700 bg-purple-100'
                                : 'text-blue-700 bg-blue-100'
                            }`}>
                              {course.creatorType}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                        <p className="text-gray-600 mb-4 flex-grow">{course.description}</p>
                        <Link href={`/course/${course.id}`}>
                          <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            View Course
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
              </div>
            </>
          )}

          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No courses available yet.</p>
              <p className="text-gray-500 mt-2">Check back soon or create your own course!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

