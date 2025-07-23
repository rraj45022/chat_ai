import { useState, useEffect } from "react";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/Chat/ChatArea";
import "./App.css";

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Session state (selected chat)
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Sessions state for sidebar
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Fetch sessions function
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await fetch("http://localhost:8000/user/sessions", {
        credentials: "include",
      });
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      setSessions([]);
    }
    setLoadingSessions(false);
  };

  // Fetch sessions on app load and when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchSessions();
    }
  }, [isLoggedIn]);

  // Check login status on app load
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/user/me", {
          credentials: "include",
        });
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  // Auth UI
  if (!isLoggedIn) {
    return showRegister
      ? <Register onToggle={() => setShowRegister(false)} />
      : <Login onLoginSuccess={() => setIsLoggedIn(true)} onToggle={() => setShowRegister(true)} />;
  }

  // Handler for creating a new chat session
  const handleNewSession = async () => {
    const title = window.prompt("Enter a title for the new chat session:");
    if (title === null) {
      // User cancelled the prompt
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/create_session", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (res.ok && data.session_id) {
        setActiveSessionId(data.session_id);
        fetchSessions(); // Refresh sessions after new session created
      }
    } catch (err) {
      alert("Unable to create new session.");
    }
  };

  // Handler for deleting a chat session
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this chat session?")) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/delete_session/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSessions(prev => prev.filter(sess => sess.session_id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
        }
      } else {
        alert("Failed to delete chat session.");
      }
    } catch (err) {
      alert("Error deleting chat session.");
    }
  };

  const handleLogout = async () => {
    await fetch("http://localhost:8000/logout", {
      method: "POST",
      credentials: "include"
    });
    setIsLoggedIn(false);
  };

  return (
    <div className="app-container">
      <header className="header" style={{height: "70px"}}>
        <span>🤖 Code_AI_</span>
        <button
          className="logoutBtn"
          onClick={handleLogout}
          style={{ marginLeft: "auto" }}
        >
          Logout
        </button>
      </header>
      <div style={{ display: "flex", height: "calc(100vh - 70px)", marginTop: "70px" }}>
      <Sidebar
        sessions={sessions}
        loadingSessions={loadingSessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />
        <main style={{ flex: 1, padding: "0", overflowY: "auto" }}>
          {!activeSessionId ? (
            <h2 style={{ padding: "32px" }}>Select a chat or create a new one</h2>
          ) : (
            <ChatArea sessionId={activeSessionId} isLoggedIn={isLoggedIn} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
