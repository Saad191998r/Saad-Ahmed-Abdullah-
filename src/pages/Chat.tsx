import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Send, User as UserIcon, Store as StoreIcon, MessageSquare } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Chat ID
  const navigate = useNavigate();
  const { currentUser, chats, messages, sendMessage, users, stores, markMessagesAsRead } = useAppContext();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = id ? chats.find(c => c.id === id) : null;
  const chatMessages = id 
    ? messages.filter(m => m.chatId === id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  useEffect(() => {
    if (id && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      markMessagesAsRead(id);
    }
  }, [id, chatMessages, markMessagesAsRead]);

  if (!currentUser) {
    return <div className="text-center py-20">الرجاء تسجيل الدخول</div>;
  }

  // If no ID provided, show list of chats
  if (!id) {
    const userChats = chats.filter(c => c.participants.includes(currentUser.id));
    
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          الرسائل
        </h1>
        
        {userChats.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500">لا توجد محادثات حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userChats.map(chat => {
              const otherUserId = chat.participants.find(p => p !== currentUser.id);
              const otherUserName = otherUserId && chat.participantNames ? chat.participantNames[otherUserId] : 'مستخدم';
              const otherUserAvatar = otherUserId && chat.participantAvatars ? chat.participantAvatars[otherUserId] : '';
              const store = chat.storeId ? stores.find(s => s.id === chat.storeId) : null;
              const unreadCount = messages.filter(m => m.chatId === chat.id && m.senderId !== currentUser.id && !m.read).length;
              
              return (
                <div 
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-4 relative"
                >
                  <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {store ? (
                      <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : otherUserAvatar ? (
                      <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 truncate">
                        {store ? store.name : otherUserName}
                      </h3>
                      <div className="flex flex-col items-end gap-1">
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {new Date(chat.lastMessage.timestamp).toLocaleDateString('ar-SA')}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                      {chat.lastMessage ? chat.lastMessage.text : 'ابدأ المحادثة الآن'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!chat || !chat.participants.includes(currentUser.id)) {
    return <div className="text-center py-20">المحادثة غير موجودة</div>;
  }

  const otherUserId = chat.participants.find(p => p !== currentUser.id);
  const otherUserName = otherUserId && chat.participantNames ? chat.participantNames[otherUserId] : 'مستخدم';
  const otherUserAvatar = otherUserId && chat.participantAvatars ? chat.participantAvatars[otherUserId] : '';
  const store = chat.storeId ? stores.find(s => s.id === chat.storeId) : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(id, newMessage);
    setNewMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50">
        <div className="h-10 w-10 rounded-full bg-white overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
          {store ? (
            <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : otherUserAvatar ? (
            <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <div>
          <h2 className="font-bold text-gray-900">
            {store ? store.name : otherUserName}
          </h2>
          {store && <span className="text-xs text-gray-500 flex items-center gap-1"><StoreIcon className="h-3 w-3" /> متجر</span>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {chatMessages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                isMe 
                  ? 'bg-indigo-600 text-white rounded-tl-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tr-none'
              }`}>
                <p>{msg.text}</p>
                <div className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-2 rounded-xl transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};
