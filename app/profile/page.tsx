'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUserData } from '@/lib/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserType } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User as UserIcon, Edit2, Check, X, Send, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [expertRequested, setExpertRequested] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadUserData = async () => {
      const data = await getUserData(user.uid);
      if (data) {
        setUserData(data);
        setDisplayName(data.displayName || '');
        setDescription(data.description || '');
        setExpertRequested(data.expertRequestSent || false);
      }
      setLoading(false);
    };

    loadUserData();
  }, [user, router]);

  const handleSave = async () => {
    if (!user || !userData) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        description: description.trim(),
      });

      setUserData({ ...userData, displayName: displayName.trim(), description: description.trim() });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestExpert = async () => {
    if (!user || !userData) return;

    try {
      // Create expert request in Firestore
      const { collection, setDoc, serverTimestamp, addDoc } = await import('firebase/firestore');
      const requestsRef = collection(db, 'expertRequests');
      await addDoc(requestsRef, {
        userId: user.uid,
        email: user.email,
        displayName: userData.displayName,
        requestedAt: serverTimestamp(),
        status: 'pending',
      });

      // Update user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        expertRequestSent: true,
      });

      setExpertRequested(true);
      setUserData({ ...userData, expertRequestSent: true });
      alert('Expert status request sent successfully! Platform admin will review your request.');
    } catch (error) {
      console.error('Error requesting expert status:', error);
      alert('Failed to send expert request. Please try again.');
    }
  };

  const getUserTypeColor = (userType?: UserType) => {
    if (!userType) return 'bg-blue-100 text-blue-700';
    switch (userType) {
      case 'Expert':
        return 'bg-yellow-100 text-yellow-700';
      case 'Architect':
        return 'bg-purple-100 text-purple-700';
      case 'Challenger':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Profile</h1>

      <Card>
        <div className="p-6">
          {userData.role === 'creator' && (
            <div className="mb-6 flex justify-end">
              <Link href="/create-course">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>
          )}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {userData.displayName?.charAt(0).toUpperCase() || userData.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editing ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg"
                      placeholder="Display Name"
                    />
                  ) : (
                    userData.displayName || userData.email
                  )}
                </h2>
                <p className="text-gray-600 mt-1">{userData.email}</p>
              </div>
            </div>

            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Type
            </label>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getUserTypeColor(userData.userType || 'Challenger')}`}>
                {userData.userType || 'Challenger'}
              </span>
              {userData.courseCount !== undefined && (
                <span className="text-sm text-gray-600">
                  ({userData.courseCount} course{userData.courseCount !== 1 ? 's' : ''} created)
                </span>
              )}
              {!userData.userType || userData.userType === 'Challenger' ? (
                <span className="text-xs text-gray-500">
                  {userData.courseCount !== undefined && userData.courseCount >= 10
                    ? ' → Will become Architect soon!'
                    : ` → Create ${10 - (userData.courseCount || 0)} more courses to become Architect`}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {userData.description || 'No description yet. Click Edit Profile to add one.'}
              </p>
            )}
          </div>

          {editing && (
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSave} isLoading={saving}>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setDisplayName(userData.displayName || '');
                  setDescription(userData.description || '');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {(userData.userType === 'Challenger' || !userData.userType) && !expertRequested && !userData.expertRequestSent && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                    Become an Expert Creator
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Request Expert status to create Expert-level courses. Platform admin will review your request.
                  </p>
                </div>
                <Button variant="primary" onClick={handleRequestExpert} size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Request Expert Status
                </Button>
              </div>
            </div>
          )}

          {(expertRequested || userData.expertRequestSent) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-700">
                  Your Expert status request has been sent and is pending review by the platform admin.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

