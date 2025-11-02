import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { FirebaseAppCheckProvider } from '@/components/FirebaseAppCheckProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlgoArena - Gamified E-Learning Platform',
  description: 'Learn through interactive skill trees and AI-powered quizzes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FirebaseAppCheckProvider>
          <Navbar />
          <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {children}
          </main>
        </FirebaseAppCheckProvider>
      </body>
    </html>
  );
}

