import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [theme, setTheme] = useState('dark');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [chatLog, setChatLog] = useState([]);
  
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
          console.log("Worker triggered PING");
        }
      };
    }
    workerRef.current.postMessage('START');

    socket.current.onmessage = (event) => {
      const data = event.data;
      if (data === "PONG") {
        console.log("Received PONG from server");
        return;
      }

      if (data?.startsWith('USERLIST:')) {
        const userArray = data.substring(9).split(',').filter(Boolean);
        setUsers(userArray);
      } else {
        setChatLog((prev) => [...prev, data]);
      }
    };

    socket.current.onclose = () => {
      console.log("WebSocket Disconnected. Attempting reconnect in 5s...");
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
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) setIsLoggedIn(true);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(`${username}: ${message}`);
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
        <span>Room: General (Logged in as {username})</span>
        <div className="theme-toggle">
          <button onClick={() => setTheme('light')} className={theme === 'light' ? 'active' : ''}>☀️</button>
          <button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'active' : ''}>🌙</button>
        </div>
      </header>
      <div className="chat-main">
        <div className="chat-box" ref={chatBoxRef}>
          {chatLog.map((msg, i) => (
            <div key={i} className="message">{msg}</div>
          ))}
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
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
