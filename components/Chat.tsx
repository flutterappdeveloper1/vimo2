import React, { useEffect, useState, useRef } from 'react';
import { rtdb } from '../services/firebase';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { ChatMessage, UserProfile } from '../types';
import { Icons } from './Icons';
import { AdBanner } from './AdBanner';

interface ChatProps {
  currentUser: UserProfile;
  targetUser: UserProfile;
  isAdmin: boolean;
  onBack: () => void;
  onVideoCall: () => void;
}

export const Chat: React.FC<ChatProps> = ({ currentUser, targetUser, isAdmin, onBack, onVideoCall }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatId = [currentUser.uid, targetUser.uid].sort().join('_');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatRef = ref(rtdb, `chats/${chatId}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMessages(msgList);
      } else {
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const chatRef = ref(rtdb, `chats/${chatId}`);
    await push(chatRef, {
      senderId: currentUser.uid,
      text: newMessage,
      timestamp: Date.now(),
      type: 'text'
    });
    setNewMessage('');
  };

  const handleDelete = async (msgId: string) => {
    if (isAdmin || window.confirm("Admins can delete any message.")) {
       const msgRef = ref(rtdb, `chats/${chatId}/${msgId}`);
       await remove(msgRef);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 shadow flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 md:hidden text-gray-600">
             &larr;
          </button>
          <img 
            src={targetUser.photoURL || ''} 
            alt={targetUser.displayName || ''} 
            className="w-10 h-10 rounded-full mr-3 border"
          />
          <div>
            <h2 className="font-bold text-gray-800">{targetUser.displayName}</h2>
            <div className="flex items-center text-xs text-gray-500">
               <span className={`w-2 h-2 rounded-full mr-1 ${targetUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
               {targetUser.status || 'offline'}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onVideoCall} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full">
            <Icons.Video />
          </button>
        </div>
      </div>

      {/* 🔧 AdMob Banner Area in Chat */}
      <AdBanner placement="chat" />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[70%] p-3 rounded-lg relative group ${
                  isMe ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p>{msg.text}</p>
                <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(msg.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                    title="Delete Message (Admin)"
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white p-3 border-t flex items-center gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..." 
          className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 px-4"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition">
          <Icons.Send />
        </button>
      </form>
    </div>
  );
};
