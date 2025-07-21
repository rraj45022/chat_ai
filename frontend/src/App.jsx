import { useState, useEffect } from "react";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/Chat/ChatArea";
import "./App.css";

function App() {
  // Authentication state
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [showRegister, setShowRegister] = useState(false);

  // Session state (selected chat)
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Auth UI
  if (!token) {
    return showRegister
      ? <Register onToggle={() => setShowRegister(false)} />
      : <Login setToken={setToken} onToggle={() => setShowRegister(true)} />;
  }

  // Handler for creating a new chat session
  const handleNewSession = async () => {
    try {
      const res = await fetch("http://localhost:8000/create_session", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
    });
      const data = await res.json();
      if (res.ok && data.session_id) {
        setActiveSessionId(data.session_id);
      }
    } catch (err) {
      alert("Unable to create new session.");
    }
  };

  return (
    <div>
      <header className="header">
        <span>🤖 Codegen Chat App</span>
        <button
          className="logoutBtn"
          onClick={() => setToken("")}
          style={{ float: "right" }}
        >
          Logout
        </button>
      </header>
      <div style={{ display: "flex", height: "calc(100vh - 70px)" }}>
        <Sidebar
          token={token}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={handleNewSession}
        />
        <main style={{ flex: 1, padding: "0" }}>
          {!activeSessionId ? (
            <h2 style={{ padding: "32px" }}>Select a chat or create a new one</h2>
          ) : (
            <ChatArea sessionId={activeSessionId} token={token} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
