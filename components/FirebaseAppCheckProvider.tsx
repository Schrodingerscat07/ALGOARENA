'use client';

import { useEffect } from 'react';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { app } from '@/lib/firebase';

export const FirebaseAppCheckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Enable App Check debug mode for development
    if (typeof window !== 'undefined') {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

      // Initialize App Check with dummy key for development
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider('dummy-key-for-dev'),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn('App Check failed to initialize, probably a dummy key.', err);
      }
    }
  }, []);

  return <>{children}</>;
};

