import React, { useEffect, useState } from "react";
import "./Sidebar.css";

const Sidebar = ({ sessions = [], loadingSessions, activeSessionId, onSelectSession, onNewSession, onDeleteSession }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Your Chats</h2>
        <button className="new-session-btn" onClick={onNewSession}>＋ New</button>
      </div>
      {loadingSessions ? (
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
              onMouseDown={e => e.stopPropagation()} // prevent click when clicking delete
            >
              <div className="sidebar-title">
                {sess.title || `Chat ${sess.session_id.slice(0, 6)}`}
              </div>
              <div className="sidebar-date">
                {new Date(sess.created_at).toLocaleString()}
              </div>
              <button
                className="delete-session-btn"
                onClick={() => onDeleteSession(sess.session_id)}
                title="Delete chat session"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default Sidebar;
