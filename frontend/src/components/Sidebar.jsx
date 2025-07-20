import React, { useEffect, useState } from "react";
import "./Sidebar.css";

const Sidebar = ({ token, activeSessionId, onSelectSession, onNewSession }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions on mount or when token changes
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:8000/user/sessions", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        setSessions([]);
      }
      setLoading(false);
    };
    if (token) fetchSessions();
  }, [token]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Your Chats</h2>
        <button className="new-session-btn" onClick={onNewSession}>＋ New</button>
      </div>
      {loading ? (
        <div className="sidebar-loading">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="sidebar-none">No chats found.</div>
      ) : (
        <ul className="sidebar-list">
          {sessions.map(sess => (
            <li
              key={sess.session_id}
              className={sess.session_id === activeSessionId ? "sidebar-item active" : "sidebar-item"}
              onClick={() => onSelectSession(sess.session_id)}
            >
              <div className="sidebar-title">
                {sess.title || `Chat ${sess.session_id.slice(0, 6)}`}
              </div>
              <div className="sidebar-date">
                {new Date(sess.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default Sidebar;
