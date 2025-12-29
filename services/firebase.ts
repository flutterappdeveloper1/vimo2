import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// 🔧 CHANGE THIS WITH YOUR OWN FIREBASE CONFIG
// Go to Firebase Console -> Project Settings -> General -> Your Apps -> SDK Setup and Configuration
const firebaseConfig = {
  // 🔧 Paste your API Key here
  apiKey: "AIzaSy_YOUR_API_KEY_HERE", 
  // 🔧 Paste your Auth Domain
  authDomain: "your-project.firebaseapp.com",
  // 🔧 Paste your Database URL (Realtime Database)
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  // 🔧 Paste your Project ID
  projectId: "your-project-id",
  // 🔧 Paste your Storage Bucket
  storageBucket: "your-project.appspot.com",
  // 🔧 Paste your Messaging Sender ID
  messagingSenderId: "123456789",
  // 🔧 Paste your App ID
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
// Use compat initialization to support auth namespaced usage
const app = firebase.initializeApp(firebaseConfig);

// Initialize Services
export const auth = firebase.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const db = getFirestore(); // For Users/Friends
export const rtdb = getDatabase(); // For Chat, Status, WebRTC Signaling

// 🔧 ADMIN CONFIGURATION
// Add the UID of the user who should be admin here manually or via Firestore
export const ADMIN_UIDS = ["YOUR_ADMIN_UID_HERE"];