import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// Removed v9 auth imports
import { collection, onSnapshot } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { auth, db, rtdb, ADMIN_UIDS } from './services/firebase';
import { UserProfile } from './types';
import { Login } from './components/Login';
import { Chat } from './components/Chat';
import { VideoCall } from './components/VideoCall';
import { AdminPanel } from './components/AdminPanel';
import { Icons } from './components/Icons';
import { AdBanner } from './components/AdBanner';

const Dashboard: React.FC<{ user: UserProfile; isAdmin: boolean }> = ({ user, isAdmin }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; } | null>(null);
  
  const navigate = useNavigate();

  // Presence and Users List
  useEffect(() => {
    // Set my status
    const myStatusRef = ref(rtdb, `status/${user.uid}`);
    set(myStatusRef, 'online');
    onDisconnect(myStatusRef).set('offline');

    // Fetch users from Firestore
    const unsubFirestore = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(u => u.uid !== user.uid); // Exclude self
      setUsers(userList);
    });

    // Listen for realtime status changes
    const unsubRtdb = onValue(ref(rtdb, 'status'), (snapshot) => {
      const statuses = snapshot.val() || {};
      setUsers(prev => prev.map(u => ({
        ...u,
        status: statuses[u.uid] || 'offline'
      })));
    });

    // Listen for Incoming Calls
    // Logic: Look for calls where ID contains my UID and check if 'offer' exists but 'answer' doesn't
    // Simplified for demo: Just checking calls path for any ID containing my UID
    const callsRef = ref(rtdb, 'calls');
    const unsubCalls = onValue(callsRef, (snapshot) => {
       const calls = snapshot.val();
       if (calls) {
         Object.keys(calls).forEach(callId => {
           if (callId.includes(user.uid) && !callId.startsWith(user.uid)) {
              // I am the callee (simple logic based on ID sorting in VideoCall comp)
              // If we wanted to be more robust, we'd check if `offer` exists
              // For now, if a call object exists involving me, and I didn't initiate, it's incoming
              const parts = callId.split('_');
              const otherId = parts.find(id => id !== user.uid);
              if (otherId && !isInCall) {
                // Check if offer exists
                if (calls[callId].offer && !calls[callId].answer) {
                  setIncomingCall({ callerId: otherId });
                }
              }
           }
         });
       }
    });

    return () => {
      unsubFirestore();
      unsubRtdb();
      unsubCalls();
      set(myStatusRef, 'offline');
    };
  }, [user.uid, isInCall]);

  const handleLogout = () => {
    set(ref(rtdb, `status/${user.uid}`), 'offline').then(() => {
      // Use compat signOut
      auth.signOut().then(() => navigate('/'));
    });
  };

  const startVideoCall = () => {
    setIsCaller(true);
    setIsInCall(true);
  };

  const acceptCall = (callerUser: UserProfile) => {
    setSelectedUser(callerUser);
    setIncomingCall(null);
    setIsCaller(false);
    setIsInCall(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar / Friends List */}
      <div className={`w-full md:w-80 bg-white border-r flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-blue-600 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
             <img src={user.photoURL || ''} alt="Me" className="w-10 h-10 rounded-full border-2 border-white" />
             <div>
               <h1 className="font-bold">{user.displayName}</h1>
               <span className="text-xs text-blue-200 block">Online</span>
             </div>
          </div>
          <div className="flex gap-2">
             {isAdmin && (
               <button onClick={() => setShowAdmin(true)} className="p-2 bg-blue-700 rounded-full hover:bg-blue-800" title="Admin Panel">
                 <Icons.Shield />
               </button>
             )}
             <button onClick={handleLogout} className="p-2 bg-blue-700 rounded-full hover:bg-blue-800">
               <Icons.LogOut />
             </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {users.map(u => (
            <div 
              key={u.uid}
              onClick={() => setSelectedUser(u)}
              className="p-4 border-b hover:bg-gray-50 cursor-pointer flex items-center transition"
            >
              <div className="relative mr-3">
                <img src={u.photoURL || ''} alt={u.displayName || ''} className="w-12 h-12 rounded-full object-cover" />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{u.displayName}</h3>
                <p className="text-sm text-gray-500">{u.status === 'online' ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 🔧 AdMob Banner Area in Sidebar */}
        <AdBanner placement="sidebar" />
      </div>

      {/* Main Area */}
      <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          isInCall ? (
            <VideoCall 
              currentUser={user} 
              targetUser={selectedUser} 
              isCaller={isCaller}
              onClose={() => setIsInCall(false)} 
            />
          ) : (
            <Chat 
              currentUser={user} 
              targetUser={selectedUser} 
              isAdmin={isAdmin}
              onBack={() => setSelectedUser(null)}
              onVideoCall={startVideoCall}
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 flex-col">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
               <Icons.UserPlus className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl">Select a friend to start chatting</p>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && !isInCall && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-4">
           <div className="bg-white p-6 rounded-xl shadow-2xl pointer-events-auto border-t-4 border-blue-500 animate-bounce">
              <h3 className="text-lg font-bold mb-4">Incoming Call...</h3>
              <div className="flex gap-4">
                 <button 
                   onClick={() => {
                     const caller = users.find(u => u.uid === incomingCall.callerId);
                     if(caller) acceptCall(caller);
                   }}
                   className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600"
                 >
                   Answer
                 </button>
                 <button 
                   onClick={() => setIncomingCall(null)}
                   className="bg-red-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600"
                 >
                   Decline
                 </button>
              </div>
           </div>
        </div>
      )}

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use compat listener
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser({
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Vimo...</div>;

  const isAdmin = user ? ADMIN_UIDS.includes(user.uid) : false;

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/app" /> : <Login />} />
        <Route path="/app" element={user ? <Dashboard user={user} isAdmin={isAdmin} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}