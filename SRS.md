# Software Requirements Specification (SRS)
## Gamified E-Learning Platform - AlgoArena

### Project Overview
A gamified e-learning platform where courses are visualized as interactive skill trees/node maps. Users progress through levels by completing nodes, with AI-powered quizzing and auto-grading capabilities.

### Technology Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database & Auth**: Firebase (Firestore, Firebase Authentication, Firebase Storage)
- **Backend**: Firebase Functions (TypeScript)
- **AI**: Google Gemini API (via Firebase Functions)
- **Styling**: Tailwind CSS
- **Core UI Library**: ReactFlow (for node maps)

---

### Database Schema (Firestore)

#### Collection: `users`
- `docId`: Firebase Auth UID
- `email`: string
- `displayName`: string
- `role`: string (Enum: "student", "creator", "admin")
- `progress`: map
  - Format: `{ "courseId-123": { "completedNodes": ["node_1", "node_2"], "currentNode": "node_3" } }`

#### Collection: `courses`
- `docId`: auto-generated ID
- `title`: string
- `description`: string
- `creatorId`: string (references users collection)
- `type`: string (Enum: "platform_official", "certified_creator", "public")
- `graphData`: string (JSON stringified ReactFlow nodes/edges data)

#### Sub-collection: `courses/{courseId}/levels`
- `docId`: MUST match nodeId from graphData
- `title`: string
- `studyMaterials`: array of maps
  - Format: `[{ type: "youtube", url: "..." }, { type: "notes_link", url: "..." }]`
- `mcqQuiz`: array of maps
  - Format: `[{ question: "What is...?", options: ["A", "B", "C"], correctIndex: 1 }]`
- `aiQuizContext`: string (detailed description for AI question generation)

---

### Core Features

#### Feature 1: Course Skill Tree UI (`/course/[courseId]`) ✅
**Requirements:**
- Render course map using ReactFlow
- Fetch and parse `graphData` from courses document
- Read-only mode (no dragging, no adding nodes)
- Fetch user progress and style nodes dynamically:
  - **Completed Nodes**: Green/glowing
  - **Unlocked (Current) Node**: Blue/highlighted
  - **Locked Nodes**: Grayed out, not clickable
- Click unlocked node → navigate to `/learn/[courseId]/[levelId]`

#### Feature 2: Level Experience (`/learn/[courseId]/[levelId]`) ✅
**Three Progressive Rounds:**

**Round 1: "Learn" (Study Materials)**
- Display `studyMaterials` array
- Embed YouTube videos
- Show links for notes/resources
- User marks "complete" to unlock Round 2

**Round 2: "Creator Quiz" (MCQs)**
- Locked until Round 1 complete
- Render `mcqQuiz` array as multiple-choice quiz
- Pass threshold: 80% required to unlock Round 3
- Auto-grade on submission

**Round 3: "AI Challenge" (AI-Powered Quiz)**
- Locked until Round 2 passed
- **Step A**: Call `generateAiQuestions` Firebase Function
  - Input: `aiQuizContext` from levels document
  - Output: 3-5 open-ended questions (array of strings)
- **Step B**: Display questions with text area inputs
- **Step C**: On submission, call `gradeAiAnswers` Firebase Function
  - Input: `aiQuizContext`, questions, user answers
  - Output: `{ score: number, feedback: string, passed: boolean }`
- **Step D**: If `passed: true`:
  - Update user progress in Firestore
  - Add `levelId` to `completedNodes` array
  - Determine next node(s) from `graphData`
  - Update `currentNode`
  - Show "Level Complete!" modal
  - Link back to course map

#### Feature 3: Course Creation Portal (`/create-course`) ✅
**Access**: Users with role "creator"

**Form Step 1: Course Details**
- Title, Description, Type fields

**Form Step 2: Graph Editor**
- ReactFlow in editor mode
- Add/remove nodes
- Connect nodes with edges
- Serialize node/edge data to JSON string
- Save to `courses.graphData`

**Form Step 3: Configure Levels**
- Display all nodes from Step 2
- For each node, configure:
  - `studyMaterials` (links)
  - `mcqQuiz` (questions/options/correctIndex)
  - `aiQuizContext` (detailed description)

---

### Backend: Firebase Functions ✅

#### Function 1: `generateAiQuestions`
**Type**: Callable
**Input**: 
```typescript
{ context: string }
```
**Logic**: 
- Prompt Gemini: "You are a helpful tutor. Based only on the following context, generate 3-5 intuitive, open-ended questions to test a student's deep understanding."
**Output**: 
```typescript
string[] // Array of questions
```

#### Function 2: `gradeAiAnswers`
**Type**: Callable
**Input**: 
```typescript
{ 
  context: string, 
  questions: string[], 
  answers: string[] 
}
```
**Logic**: 
- Prompt Gemini: "You are an expert grader. Based on the following context, grade the user's answers to the questions. Provide a score from 0-100, brief feedback, and a boolean passed (true if score > 75)."
**Output**: 
```typescript
{ 
  score: number, 
  feedback: string, 
  passed: boolean 
}
```

---

### Seed Content: Platform Official Courses ✅

#### Course 1: Intro to Machine Learning ✅
- Nodes: "What is ML?", "Supervised Learning (Regression)", "Unsupervised Learning (Clustering)", "Your First Model"
- AI Context: Comprehensive descriptions for each level

#### Course 2: Foundations of Quantum Mechanics ✅
- Nodes: "Classical vs. Quantum", "Wave-Particle Duality", "Superposition & Entanglement", "Schrödinger's Cat"

#### Course 3: Database Management Systems (DBMS) ✅
- Nodes: "What is a Database?", "Relational Models (SQL)", "NoSQL Models", "ACID Transactions"

#### Course 4: Principles of Aerodynamics ✅
- Nodes: "The Four Forces of Flight", "Airfoils and Lift", "Drag and Thrust", "Flight Stability"

Each course includes:
- Complete `graphData` JSON (3-4 connected nodes)
- Corresponding `levels` documents for each node
- Mock data for `studyMaterials`, `mcqQuiz`, and `aiQuizContext`

---

### UI/UX Requirements ✅
- Modern, clean, highly interactive design
- Strong focus on ReactFlow gamified map visualization
- Responsive design (mobile-friendly)
- Loading states and error handling
- Success animations and feedback

---

### Security Requirements ✅
- Firebase Authentication required for all protected routes
- Role-based access control (student, creator, admin)
- API keys (Gemini) stored securely in Firebase Functions
- Firestore security rules to protect user data

---

### Implementation Status

- [x] Project Structure Initialized
- [x] Firebase Configuration Setup
- [x] Core Components Implemented
- [x] Course Map UI (ReactFlow) Implemented
- [x] Level Experience Pages Implemented
- [x] Course Creation Portal Implemented
- [x] Firebase Functions Created
- [x] Seed Data Script Created
- [x] UI Components and Styling
- [x] Firestore Security Rules
- [x] Documentation

---

## Next Steps for Deployment

1. Install dependencies: `npm install && cd functions && npm install`
2. Deploy Firebase Functions with Gemini API key
3. Deploy Firestore rules
4. Seed database with initial courses
5. Deploy Next.js app to Vercel
6. Test end-to-end functionality

