'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllCourses } from '@/lib/firestore';
import { Course } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Star } from 'lucide-react';

export default function CoursesPage() {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-game-accent1 animate-glow drop-shadow-[0_0_10px_#7A3BB3]">
          All Courses
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} hover>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    course.type === 'platform_official' 
                      ? 'text-primary-700 bg-primary-100'
                      : 'text-game-accent2 bg-game-surface'
                  }`}>
                    {course.type === 'platform_official' ? 'PLATFORM (EXCLUSIVE)' : 'COMMUNITY'}
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
      )}
    </div>
  );
}