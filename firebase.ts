import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  // Assuming FIREBASE_CONFIG is provided as a JSON string in the environment
  const firebaseConfigString = process.env.FIREBASE_CONFIG;
  if (firebaseConfigString) {
    const firebaseConfig = JSON.parse(firebaseConfigString);
    if (firebaseConfig && firebaseConfig.apiKey) {
      firebaseApp = initializeApp(firebaseConfig);
      auth = getAuth(firebaseApp);
      db = getFirestore(firebaseApp);
    }
  }
} catch (e) {
  console.error("Could not initialize Firebase. Is the FIREBASE_CONFIG environment variable set correctly as a JSON string?", e);
}

export { firebaseApp, auth, db };
