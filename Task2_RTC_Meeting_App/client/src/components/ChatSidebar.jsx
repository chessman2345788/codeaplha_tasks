import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Download, X } from 'lucide-react';
import axios from 'axios';

const ChatSidebar = ({ messages = [], sendMessage, currentUser, token }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage({ text: text.trim() });
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        sendMessage({ text: text.trim() });
        setText('');
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      const { fileUrl, fileName } = response.data;
      sendMessage({ text: `📎 Shared a file: ${fileName}`, fileUrl, fileName });
    } catch (error) {
      console.error('Error uploading file', error);
      alert('Failed to upload file. ' + (error.response?.data?.error || ''));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-sidebar">
      {}
      <div className="chat-header">
        <h2>Meeting Chat</h2>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {}
      <div className="chat-messages">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender === currentUser;
          const isSystem = msg.sender === 'System';

          if (isSystem) {
            return (
              <div key={idx} className="message system">
                <div className="message-bubble">{msg.text}</div>
              </div>
            );
          }

          return (
            <div key={idx} className={`message ${isOwn ? 'own' : 'other'}`}>
              {!isOwn && <div className="message-sender">{msg.sender}</div>}

              <div className="message-bubble">
                {msg.text && <span style={{ display: 'block' }}>{msg.text}</span>}

                {msg.fileUrl && (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="file-download-link"
                  >
                    <Download size={14} />
                    {msg.fileName || 'Download file'}
                  </a>
                )}
              </div>

              <div className="message-time">{formatTime(msg.timestamp)}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {}
      <form onSubmit={handleSend} className="chat-input-area">
        {}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {}
        <button
          type="button"
          className="icon-btn"
          style={{ width: 36, height: 36, flexShrink: 0, background: 'transparent', border: '1px solid var(--border)' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Attach File"
        >
          {isUploading ? (
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          ) : (
            <Paperclip size={16} />
          )}
        </button>

        <input
          type="text"
          className="chat-input"
          placeholder={isUploading ? 'Uploading...' : 'Message... (Enter to send)'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isUploading}
        />

        <button type="submit" className="send-btn" disabled={isUploading || !text.trim()} title="Send">
          <Send size={16} />
        </button>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ChatSidebar;
