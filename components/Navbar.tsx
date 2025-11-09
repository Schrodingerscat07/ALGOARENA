'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUserData, logout } from '@/lib/auth';
import { User } from '@/types';
import { Button } from './ui/Button';
import { GraduationCap, BookOpen, Plus, LogOut, User as UserIcon, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      getUserData(user.uid).then(setUserData);
    } else {
      setUserData(null);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-game-surface shadow-lg border-b border-game-border sticky top-0 z-40 minecraft-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-game-accent1" />
            <span className="text-2xl font-bold bg-gradient-to-r from-game-accent1 to-game-accent2 bg-clip-text text-transparent">
              AlgoArena
            </span>
          </Link>

          <div className="flex items-center space-x-4">

            <div className="flex items-center space-x-2">
              <Link
                href="/courses"
                className="text-game-accent2 hover:text-game-accent1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Courses
              </Link>
              {user && (
                <Link
                  href="/create-course"
                  className="text-game-accent2 hover:text-game-accent1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </Link>
              )}
            </div>

            {userData?.role === 'admin' && (
              <Link
                href="/admin/expert-requests"
                className="text-game-accent2 hover:text-game-accent1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            {loading ? (
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 text-sm text-game-text hover:text-game-accent1 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="font-medium">{userData?.displayName || user.email}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

