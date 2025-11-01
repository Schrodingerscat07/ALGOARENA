'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllCourses } from '@/lib/firestore';
import { Course } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, ArrowRight, Star } from 'lucide-react';

export default function HomePage() {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
          Master Skills Through
          <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {' '}Interactive Learning
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Navigate skill trees, unlock levels, and test your knowledge with AI-powered quizzes.
          Your learning journey, gamified.
        </p>
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
            <h2 className="text-3xl font-bold text-gray-900">Platform Official Courses</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {platformOfficial.map((course) => (
              <Card key={course.id} hover>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 text-xs font-semibold text-primary-700 bg-primary-100 rounded">
                      {course.type.replace('_', ' ').toUpperCase()}
                    </span>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-6">All Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter((c) => c.type !== 'platform_official')
                  .map((course) => (
                    <Card key={course.id} hover>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded">
                            {course.type.replace('_', ' ').toUpperCase()}
                          </span>
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

