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
  const chatBoxRef = useRef(null); // Ref for the chat messages container

  // Apply theme to the HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Connect to WebSocket once the user joins
  useEffect(() => {
    if (isLoggedIn) {
      // Connect to your endpoint with a room parameter
      socket.current = new WebSocket(`wss://www.pluckier.co.uk/utils/chatservice/general/${username}`);

      socket.current.onmessage = (event) => {
        const data = event.data;
        if (data && typeof data === 'string' && data.startsWith('USERLIST:')) {
          const userArray = data.substring(9).split(',').filter(Boolean);
          setUsers(userArray);
        } else {
          setChatLog((prev) => [...prev, data]);
        }
      };

      socket.current.onclose = () => console.log("WebSocket Disconnected");
      
      return () => socket.current.close();
    }
  }, [isLoggedIn]);

  // Auto-scroll to the bottom when chatLog updates
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
    if (message.trim() && socket.current) {
      const payload = `${username}: ${message}`;
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
        <span>Room: General (Logged in as {username})</span>
        <div className="theme-toggle">
          <button 
            onClick={() => setTheme('light')} 
            className={theme === 'light' ? 'active' : ''}
          >☀️</button>
          <button 
            onClick={() => setTheme('dark')} 
            className={theme === 'dark' ? 'active' : ''}
          >🌙</button>
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
            {users.map((user) => (
              <li key={user} className={user === username ? 'self' : ''}>
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
