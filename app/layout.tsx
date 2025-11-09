import type { Metadata } from 'next';
import { Press_Start_2P } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { FirebaseAppCheckProvider } from '@/components/FirebaseAppCheckProvider';

const gameFont = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

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
      <body className={gameFont.className}>
        <FirebaseAppCheckProvider>
          <Navbar />
          <main className="min-h-screen bg-game-background">
            {children}
          </main>
        </FirebaseAppCheckProvider>
      </body>
    </html>
  );
}

