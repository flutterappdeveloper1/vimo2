import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Icons } from './Icons';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const colRef = collection(db, 'users');
      const snap = await getDocs(colRef);
      const userList = snap.docs.map(d => d.data() as UserProfile);
      setUsers(userList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const toggleBan = async (uid: string, currentStatus: boolean | undefined) => {
      // In a real app, this would be a custom claim or a field check in rules
      // Here we just flag it in Firestore for demo purposes
      await updateDoc(doc(db, 'users', uid), {
          isBanned: !currentStatus
      });
      setUsers(users.map(u => u.uid === uid ? {...u, isBanned: !currentStatus} : u));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icons.Shield className="text-blue-600" /> Admin Panel
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
             <p className="text-center text-gray-500">Loading users...</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2">User</th>
                  <th className="p-2">UID</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.uid} className="border-b hover:bg-gray-50">
                    <td className="p-2 flex items-center gap-2">
                       <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" />
                       <span className={user.isBanned ? "line-through text-red-500" : ""}>{user.displayName}</span>
                    </td>
                    <td className="p-2 text-xs font-mono text-gray-500">{user.uid}</td>
                    <td className="p-2 text-sm">{user.email}</td>
                    <td className="p-2">
                       <button 
                         onClick={() => toggleBan(user.uid, (user as any).isBanned)}
                         className={`px-3 py-1 rounded text-xs font-bold ${
                           (user as any).isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                         }`}
                       >
                         {(user as any).isBanned ? 'Unban' : 'Ban'}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
