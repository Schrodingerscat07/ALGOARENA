# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

## 2. Firebase Setup

Your Firebase credentials are already configured in `.env.local`.

### Enable Firestore:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **arena-746bb**
3. Navigate to **Firestore Database**
4. Click **Create Database**
5. Start in **test mode** (we have security rules configured)
6. Choose a location (preferably close to your users)

### Enable Authentication:
1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** provider
4. Enable **Google** provider (optional, but recommended)

## 3. Deploy Firebase Functions

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set your Gemini API key
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY_HERE"

# Build and deploy functions
cd functions
npm run build
firebase deploy --only functions
cd ..
```

**Note:** Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## 5. Seed Initial Data

After deploying, you can seed the database with 4 official courses:

### Option A: Using Postman or curl
```bash
curl -X POST http://localhost:3000/api/seed
```

### Option B: Using a browser
Navigate to the seed route (you'll need to modify it to accept GET requests temporarily) or create a simple admin page.

### Option C: Create a seed script
Create a file `scripts/seed.ts`:

```typescript
import seedCourses from '../lib/seedData';
seedCourses().then(() => {
  console.log('Done!');
  process.exit(0);
});
```

Run with: `npx ts-node scripts/seed.ts`

## 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 7. Test the Platform

1. **Sign Up** as a new user (choose "creator" role to test course creation)
2. **Browse Courses** on the home page
3. **Start a Course** - Click on any course to see the skill tree
4. **Complete a Level** - Go through all 3 rounds (Learn → Quiz → AI Challenge)
5. **Create a Course** - If you're a creator, test the course creation flow

## Troubleshooting

### Functions not working?
- Make sure functions are deployed: `firebase deploy --only functions`
- Check Firebase Console → Functions to see if they're active
- Verify your Gemini API key is set correctly

### Authentication not working?
- Check that Authentication is enabled in Firebase Console
- Verify your `.env.local` has correct Firebase config
- Check browser console for errors

### Can't see courses?
- Make sure you've seeded the database (step 5)
- Check Firestore in Firebase Console to see if courses exist
- Verify Firestore rules allow reading courses

### ReactFlow errors?
- Make sure `reactflow` is installed: `npm install reactflow`
- The CSS is imported in `components/CourseMap.tsx`

## Next Steps

- Customize the UI colors in `tailwind.config.ts`
- Add more seed courses
- Deploy to production (Vercel + Firebase)

