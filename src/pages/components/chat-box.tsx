import { useEffect, useState } from 'react';
import { socket } from "../../utils/socket";
import { useUser } from '../../hooks/useUser';

interface Message {
  id: number;
  text: string;
  username: string;
  timestamp: Date;
}

interface ChatBoxProps {
  roomId: string;  
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ roomId, onClose }) => {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`chat_${roomId}`);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
     
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Error loading chat messages:', error);
      return [];
    }
  });

  
  useEffect(() => {
    try {
      localStorage.setItem(`chat_${roomId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }, [messages, roomId]);

  useEffect(() => {
    if (!user?.email) return;

    try {
      socket.emit("Join_chat", { roomID: roomId, username: user.email });

      const handleNewMessage = (msgData: any) => {
        if (!msgData || !msgData.roomId || msgData.roomId !== roomId) return;

        const newMessage = {
          id: Date.now(),
          text: msgData.message || '',
          username: msgData.username || 'Unknown',
          timestamp: new Date(msgData.timestamp || Date.now())
        };

        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      };

      socket.on("receive_message", handleNewMessage);
      return () => {
        socket.off("receive_message", handleNewMessage);
      };
    } catch (error) {
      console.error('Error in chat socket handling:', error);
    }
  }, [roomId, user]);

  const handleSend = () => {
    if (!message.trim() || !user?.email) return;

    socket.emit("send_message", {
      roomID: roomId,
      username: user.email,
      message: message.trim()
    });

    setMessage('');
  };


  const handleClearChat = () => {
    localStorage.removeItem(`chat_${roomId}`);
    setMessages([]);
  };

  return (
    <div className="h-full flex flex-col backdrop-blur-md bg-gray-900/70 border border-gray-800 rounded-lg shadow-lg">
      
      
      <div className="shrink-0 px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-cyan-400">Team Chat</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-900/30">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.username === user?.email ? "items-end" : "items-start"}`}
          >
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.username === user?.email
                ? "bg-cyan-500/20 border border-cyan-500/30"
                : "bg-gray-800/50 border border-gray-700"
            }`}>
              <p className="text-sm text-white">{msg.text}</p>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {msg.username} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 border-t border-gray-800 bg-gray-900/50 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            Send
          </button>
        </div>

      
        <button
          onClick={handleClearChat}
          className="text-xs text-gray-400 hover:text-white self-end"
        >
          Clear Chat
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
