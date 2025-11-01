# AlgoArena - Gamified E-Learning Platform

A modern, gamified e-learning platform where courses are visualized as interactive skill trees. Users progress through levels by completing nodes, with AI-powered quizzing and auto-grading capabilities.

## Features

- 🎮 **Interactive Skill Trees**: Courses visualized as node maps using ReactFlow
- 🎯 **Level-Based Progression**: Complete levels to unlock new nodes
- 📚 **Three-Stage Learning**: Learn → MCQ Quiz → AI Challenge
- 🤖 **AI-Powered Quizzing**: Google Gemini API generates and grades open-ended questions
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🔐 **Authentication**: Firebase Authentication with role-based access
- 📊 **Progress Tracking**: Track completion across all courses
- 🎓 **Course Creation**: Full course creation portal for creators

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database & Auth**: Firebase (Firestore, Firebase Authentication)
- **Backend**: Firebase Functions (TypeScript)
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS
- **UI Library**: ReactFlow

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account and project
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up Firebase:**

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Firebase Authentication (Email/Password and Google providers)
   - Copy your Firebase config to `.env.local` (already included)

3. **Set up Firebase Functions:**

```bash
cd functions
npm install
cd ..
```

4. **Configure Gemini API Key:**

   For local development, add your Gemini API key to Firebase Functions config:

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

   Or set it as an environment variable in your deployment.

5. **Deploy Firebase Functions:**

```bash
cd functions
npm run build
firebase deploy --only functions
cd ..
```

6. **Deploy Firestore Security Rules:**

```bash
firebase deploy --only firestore:rules
```

7. **Seed Initial Data:**

   Visit `/api/seed` (POST request) or use a tool like Postman to seed the platform with 4 official courses.

   Alternatively, you can create a simple script:

```javascript
// seed.js (run with node)
const seedData = require('./lib/seedData');
seedData.default().then(() => {
  console.log('Seeded!');
  process.exit(0);
});
```

8. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
AlgoArena/
├── app/                    # Next.js App Router pages
│   ├── course/[courseId]/  # Course detail page with skill tree
│   ├── learn/[courseId]/[levelId]/  # Level experience page
│   ├── create-course/      # Course creation portal
│   ├── login/              # Authentication pages
│   └── api/                # API routes
├── components/             # React components
│   ├── CourseMap.tsx       # ReactFlow skill tree visualization
│   ├── GraphEditor.tsx     # Course creation graph editor
│   └── ui/                 # Reusable UI components
├── lib/                    # Utilities and Firebase setup
│   ├── firebase.ts         # Firebase initialization
│   ├── auth.ts             # Authentication helpers
│   ├── firestore.ts        # Firestore operations
│   └── seedData.ts         # Seed data script
├── functions/              # Firebase Functions
│   └── src/
│       └── index.ts        # AI Functions (Gemini integration)
└── types/                  # TypeScript type definitions
```

## Key Features Explained

### Course Skill Tree

Each course is visualized as a node map where:
- **Green nodes**: Completed levels
- **Blue nodes**: Unlocked/current level
- **Gray nodes**: Locked (prerequisites not met)

Clicking an unlocked node navigates to the level page.

### Level Experience

Each level has three progressive rounds:

1. **Learn**: Study materials (YouTube videos, articles, documents)
2. **Creator Quiz**: Multiple-choice questions (must score 80%+ to proceed)
3. **AI Challenge**: AI-generated open-ended questions, auto-graded by Gemini

### Course Creation

Creators can:
- Define course details
- Build interactive skill trees using ReactFlow
- Configure levels with study materials, MCQs, and AI context

### AI Integration

Two Firebase Functions power the AI features:
- `generateAiQuestions`: Generates 3-5 questions based on level context
- `gradeAiAnswers`: Grades student answers and provides feedback

## Firebase Configuration

### Firestore Rules

See `firestore.rules` for security rules. Key points:
- Users can read courses and their own progress
- Only creators/admins can create courses
- Course creators can edit their courses

### Functions

Deploy functions with:

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Environment Variables

Ensure `.env.local` contains:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Deploy Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## Seed Data

The platform includes 4 seed courses:
1. Intro to Machine Learning
2. Foundations of Quantum Mechanics
3. Database Management Systems (DBMS)
4. Principles of Aerodynamics

To seed, make a POST request to `/api/seed` or run the seed script.

## Contributing

This is a complete production-ready platform. Feel free to extend it with additional features like:
- User profiles and achievements
- Discussion forums
- Certificates
- Advanced analytics
- Social features

## License

MIT License - feel free to use this project for your own purposes!

