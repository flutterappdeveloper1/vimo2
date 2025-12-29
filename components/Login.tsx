import React, { useState } from 'react';
import { auth, googleProvider, db, rtdb } from '../services/firebase';
// Removed v9 auth imports as we are using compat auth instance
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, set, onDisconnect } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUserSetup = async (user: any, userName?: string) => {
    // Firestore Profile
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: userName || user.displayName || 'User',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${userName || user.email}`,
        createdAt: Date.now()
      });
    }

    // Realtime Database Presence
    const statusRef = ref(rtdb, `status/${user.uid}`);
    await set(statusRef, 'online');
    onDisconnect(statusRef).set('offline');

    navigate('/app');
  };

  const handleGoogleLogin = async () => {
    try {
      // Use compat method
      const result = await auth.signInWithPopup(googleProvider);
      await handleUserSetup(result.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        // Use compat method
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await handleUserSetup(result.user, name);
      } else {
        // Use compat method
        const result = await auth.signInWithEmailAndPassword(email, password);
        await handleUserSetup(result.user);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-500">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img 
            src="https://postimg.cc/xcP9fh1N" 
            alt="Vimo Logo" 
            className="w-16 h-16 mb-2 rounded-xl object-cover"
            onError={(e) => {
              // Fallback if the provided link is a webpage and not an image
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-3xl font-bold text-center text-blue-600">Vimo</h1>
        </div>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-semibold">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between">
          <hr className="w-full border-gray-300" />
          <span className="px-2 text-gray-500 text-sm">OR</span>
          <hr className="w-full border-gray-300" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-white border border-gray-300 text-gray-700 p-3 rounded flex items-center justify-center hover:bg-gray-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 mr-2" alt="Google" />
          Sign in with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="ml-1 text-blue-600 font-bold hover:underline"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};