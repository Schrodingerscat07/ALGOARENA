'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getCourse, updateCourse } from '@/lib/firestore';
import { Course } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        if (!courseId) {
          setError('Invalid course id');
          return;
        }
        const data = await getCourse(courseId);
        if (!data) {
          router.push('/');
          return;
        }
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description);
        setDetailedDescription(data.detailedDescription || '');
      } catch (e: any) {
        setError(e?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!course) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <div className="p-6">
          <p className="text-gray-600">{error || 'Course not found'}</p>
        </div>
      </Card>
    </div>
  );

  const isCreator = user && user.uid === course.creatorId;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreator) return;
    setSaving(true);
    try {
      await updateCourse(courseId, {
        title: title.trim(),
        description: description.trim(),
        detailedDescription: detailedDescription.trim(),
      });
      router.push(`/course/${courseId}`);
    } catch (err) {
      alert('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/course/${courseId}`}>
          <Button variant="ghost" className="inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Button>
        </Link>
      </div>

      {!isCreator ? (
        <Card>
          <div className="p-6">
            <p className="text-red-600">Only the creator can edit this course.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="detailedDescription" className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
              <textarea id="detailedDescription" rows={6} value={detailedDescription} onChange={(e) => setDetailedDescription(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" isLoading={saving} className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}


