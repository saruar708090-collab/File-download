import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const analytics = (() => {
  try {
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      return getAnalytics(app);
    }
  } catch (e) {
    console.warn('Analytics notice:', e);
  }
  return null;
})();
