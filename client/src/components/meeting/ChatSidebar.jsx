import { useState, useEffect, useRef } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../utils/socket';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const ChatSidebar = () => {
  const { user } = useAuthStore();
  const {
    isChatOpen,
    messages,
    typingUsers,
    toggleChat,
    clearUnreadCount,
  } = useMeetingStore();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socket = getSocket();

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear unread count when chat opens
  useEffect(() => {
    if (isChatOpen) {
      clearUnreadCount();
    }
  }, [isChatOpen, clearUnreadCount]);

  const handleTyping = (e) => {
    setMessageInput(e.target.value);

    // Emit typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { isTyping: true });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { isTyping: false });
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    socket.emit('send-message', { message: messageInput.trim() });
    setMessageInput('');

    // Clear typing indicator
    if (isTyping) {
      setIsTyping(false);
      socket.emit('typing', { isTyping: false });
    }
  };

  if (!isChatOpen) return null;

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-semibold">Chat</h3>
        <button
          onClick={toggleChat}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="animate-fadeIn">
              {msg.messageType === 'system' ? (
                <div className="text-center">
                  <p className="text-gray-400 text-xs">{msg.message}</p>
                </div>
              ) : (
                <div
                  className={`flex flex-col ${
                    msg.userId === user?._id ? 'items-end' : 'items-start'
                  }`}
                >
                  {msg.userId !== user?._id && (
                    <div className="flex items-center gap-2 mb-1">
                      {msg.userAvatar ? (
                        <img
                          src={msg.userAvatar}
                          alt={msg.userName}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">
                            {msg.userName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-400 text-xs font-medium">
                        {msg.userName}
                      </span>
                    </div>
                  )}
                  <div
                    className={`message-bubble ${
                      msg.userId === user?._id ? 'own' : 'other'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.userId === user?._id
                          ? 'text-primary-200'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatDistanceToNow(new Date(msg.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-2 border-t border-gray-700">
          <p className="text-gray-400 text-xs">
            {Array.from(typingUsers).join(', ')}{' '}
            {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatSidebar;
