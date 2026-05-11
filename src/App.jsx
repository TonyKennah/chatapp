import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [theme, setTheme] = useState('dark');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [chatLog, setChatLog] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const socket = useRef(null);
  const chatBoxRef = useRef(null);
  const workerRef = useRef(null); // Keep worker in a ref

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const connectWebSocket = () => {
    if (!isLoggedIn) return;

    socket.current = new WebSocket(`wss://www.pluckier.co.uk/utils/chatservice/general/${username}`);

    // Start Worker Heartbeat
    if (!workerRef.current) {
      workerRef.current = new Worker('heartbeatWorker.js');
      workerRef.current.onmessage = () => {
        if (socket.current?.readyState === WebSocket.OPEN) {
          socket.current.send("PING");
        }
      };
    }
    workerRef.current.postMessage('START');

    socket.current.onmessage = (event) => {
      const data = event.data;
      if (data === "PONG") {
        return;
      }

      if (data?.startsWith('USERLIST:')) {
        const userArray = data.substring(9).split(',').filter(Boolean);
        setUsers(userArray);
      } else {
        try {
          const parsed = JSON.parse(data);
          setChatLog((prev) => [...prev, parsed]);
        } catch (e) {
          // Fallback for legacy strings "User: Message"
          if (typeof data === 'string' && data.includes(': ')) {
            const [user, ...rest] = data.split(': ');
            setChatLog((prev) => [...prev, { user, text: rest.join(': ') }]);
          } else {
            setChatLog((prev) => [...prev, { text: data }]);
          }
        }
      }
    };

    socket.current.onclose = () => {
      workerRef.current?.postMessage('STOP');
      
      // Auto-reconnect logic
      setTimeout(() => {
        if (isLoggedIn) connectWebSocket();
      }, 5000);
    };
  };

  useEffect(() => {
    if (isLoggedIn) {
      connectWebSocket();
    }

    return () => {
      socket.current?.close();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [isLoggedIn]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatLog, autoScroll]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) setIsLoggedIn(true);
  };

  // Helper to parse URLs and turn them into clickable links
  const renderMessageText = (text) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(/^https?:\/\//)) {
        // Image Detection
        if (part.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
          return (
            <img 
              key={index} 
              src={part} 
              alt="Shared content" 
              style={{ width: '100px', height: '100px', objectFit: 'cover', display: 'block', borderRadius: '8px', marginTop: '8px' }} 
            />
          );
        }

        // Audio Detection
        if (part.match(/\.(mp3|wav|ogg)$/i)) {
          return <audio key={index} controls src={part} style={{ display: 'block', marginTop: '8px', maxWidth: '100%' }} />;
        }

        // YouTube Detection
        const ytMatch = part.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch) {
          return (
            <div key={index} style={{ marginTop: '8px', maxWidth: '400px' }}>
              <iframe
                width="100%"
                height="225"
                src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: '8px' }}
              ></iframe>
            </div>
          );
        }

        // Fallback to standard link
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer">{part}</a>;
      }
      return part;
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ user: username, text: message });
      socket.current.send(payload);
      setMessage('');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`login-container ${theme}`}>
        <form onSubmit={handleJoin}>
          <h1>Join Chat</h1>
          <input 
            type="text" 
            placeholder="Enter username..." 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <button type="submit">Enter Room</button>
        </form>
      </div>
    );
  }

  return (
    <div className={`chat-container ${theme}`}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>Room: General (Logged in as {username})</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>
            {currentTime.toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
          <span style={{ fontSize: '0.85rem', padding: '2px 8px', backgroundColor: 'rgba(255, 204, 0, 0.3)', borderRadius: '4px', fontWeight: 'bold' }}>
            Questions: {chatLog.filter(msg => 
              msg.text?.trim().startsWith('QUESTION') || 
              msg.text?.trim().startsWith('Q:')
            ).length}
          </span>
        </div>
        <div className="theme-toggle">
          <button 
            onClick={() => setAutoScroll(!autoScroll)} 
            className={autoScroll ? 'active' : ''}
            title={autoScroll ? "Disable Auto-scroll" : "Enable Auto-scroll"}
          >
            {autoScroll ? '⬇️' : '✋'}
          </button>
          <button onClick={() => setTheme('light')} className={theme === 'light' ? 'active' : ''}>☀️</button>
          <button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'active' : ''}>🌙</button>
          <button onClick={() => setTheme('funky')} className={theme === 'funky' ? 'active' : ''}>🎸</button>
        </div>
      </header>
      <div className="chat-main">
        <div className="chat-box" ref={chatBoxRef}>
          {chatLog.map((msg, i) => {
            const isQuestion = msg.text?.trim().startsWith('QUESTION')  || msg.text?.trim().startsWith('Q:');
            const highlightStyle = isQuestion ? {
              backgroundColor: 'rgba(255, 255, 0, 0.2)',
              borderLeft: '5px solid #ffcc00',
              paddingLeft: '12px',
              borderRadius: '4px 15px 15px 4px' // Squares the left side to align with the border
            } : {};

            return (
              <div key={i} className="message" style={highlightStyle}>
                {msg.user && <span className="msg-user">{msg.user}: </span>}
                <span className="msg-text">{renderMessageText(msg.text)}</span>
              </div>
            );
          })}
        </div>
        <aside className="user-list">
          <h3>Users ({users.length})</h3>
          <ul>
            {users.map((user, idx) => (
              <li key={`${user}-${idx}`} className={user === username ? 'self' : ''}>
                {user} {user === username ? '(You)' : ''}
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <form className="input-area" onSubmit={sendMessage}>
        <input 
          style={{ fontSize: '1.1rem', padding: '12px' }}
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Type a message..."
        />
        <button type="submit" style={{ fontSize: '1.1rem', padding: '10px 24px' }}>Send</button>
      </form>
    </div>
  );
}

export default App;
