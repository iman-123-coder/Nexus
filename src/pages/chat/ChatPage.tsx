import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Phone, Video, MessageCircle, Loader } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface ChatUser {
  _id: string;
  name: string;
  avatar?: string;
  role: string;
}

interface Message {
  _id?: string;
  sender: { _id: string; name: string; avatar?: string };
  receiver: { _id: string; name: string; avatar?: string };
  content: string;
  createdAt?: string;
  tempId?: string;
}

interface Conversation {
  user: ChatUser;
  lastMessage: Message;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPartner, setChatPartner] = useState<ChatUser | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect socket
  useEffect(() => {
    if (!currentUser) return;
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current.emit('user-online', currentUser.id);

    socketRef.current.on('online-users', (users: string[]) => {
      setOnlineUsers(users);
    });

    socketRef.current.on('receive-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      fetchConversations();
    });

    socketRef.current.on('typing', (senderId: string) => {
      if (senderId === userId) setIsTyping(true);
    });

    socketRef.current.on('stop-typing', (senderId: string) => {
      if (senderId === userId) setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
  }, []);

  // Load messages when userId changes
  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
      const found = allUsers.find(u => u._id === userId);
      if (found) setChatPartner(found);
    }
  }, [userId, allUsers]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoadingConvos(true);
      const { data } = await api.get('/messages');
      setConversations(data.conversations);
    } catch {
      // silent
    } finally {
      setLoadingConvos(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setAllUsers(data.users);
    } catch {
      // silent
    }
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      setLoadingMsgs(true);
      setMessages([]);
      const [msgRes, userRes] = await Promise.all([
        api.get(`/messages/${partnerId}`),
        api.get('/auth/users')
      ]);
      setMessages(msgRes.data.messages);
      const partner = msgRes.data.messages[0]
        ? (msgRes.data.messages[0].sender._id === partnerId
            ? msgRes.data.messages[0].sender
            : msgRes.data.messages[0].receiver)
        : userRes.data.users.find((u: any) => u._id === partnerId);
      if (partner) setChatPartner(partner);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Optimistic UI
    const tempMsg: Message = {
      tempId: Date.now().toString(),
      sender: { _id: currentUser.id, name: currentUser.name },
      receiver: { _id: userId, name: chatPartner?.name || '' },
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await api.post('/messages', { receiverId: userId, content });
      // Replace temp with real
      setMessages(prev => prev.map(m => m.tempId === tempMsg.tempId ? data.message : m));
      // Emit to socket for real-time delivery
      socketRef.current?.emit('send-message', {
        ...data.message,
        receiverId: userId,
      });
      fetchConversations();
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.tempId !== tempMsg.tempId));
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!userId || !currentUser) return;
    socketRef.current?.emit('typing', { senderId: currentUser.id, receiverId: userId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { senderId: currentUser.id, receiverId: userId });
    }, 1500);
  };

  const openChat = (partnerId: string) => {
    navigate(`/chat/${partnerId}`);
    setShowNewChat(false);
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            + New
          </button>
        </div>

        {/* New chat user picker */}
        {showNewChat && (
          <div className="border-b border-gray-200 p-3 bg-gray-50 max-h-52 overflow-y-auto">
            <p className="text-xs text-gray-500 mb-2">Select a user to chat with:</p>
            {allUsers.map(u => (
              <button
                key={u._id}
                onClick={() => openChat(u._id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex justify-center py-8">
              <Loader size={24} className="animate-spin text-primary-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 px-4">
              <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Click + New to start chatting</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isOnline = onlineUsers.includes(conv.user._id);
              const isActive = userId === conv.user._id;
              return (
                <button
                  key={conv.user._id}
                  onClick={() => openChat(conv.user._id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors ${
                    isActive ? 'bg-primary-50 border-r-2 border-primary-600' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                      {conv.user.name.charAt(0).toUpperCase()}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{conv.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.content || ''}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {userId && chatPartner ? (
          <>
            {/* Chat header */}
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {chatPartner.name.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.includes(chatPartner._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{chatPartner.name}</h3>
                  <p className="text-xs text-gray-500">
                    {onlineUsers.includes(chatPartner._id) ? (
                      <span className="text-green-500">Online</span>
                    ) : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="p-2" aria-label="Voice call">
                  <Phone size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  aria-label="Video call"
                  onClick={() => navigate(`/video`)}
                >
                  <Video size={18} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
              {loadingMsgs ? (
                <div className="flex justify-center py-12">
                  <Loader size={28} className="animate-spin text-primary-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle size={40} className="mb-3 text-gray-300" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm">Say hello to {chatPartner.name}!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.sender._id === currentUser.id;
                  return (
                    <div key={msg._id || msg.tempId || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        {msg.createdAt && (
                          <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 px-6 py-4 bg-white">
              <form onSubmit={handleSend} className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder={`Message ${chatPartner.name}...`}
                  value={newMessage}
                  onChange={handleTyping}
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={56} className="mb-4 text-gray-200" />
            <h3 className="text-lg font-medium text-gray-600">Select a conversation</h3>
            <p className="text-sm mt-1">Or click + New to start a new chat</p>
          </div>
        )}
      </div>
    </div>
  );
};