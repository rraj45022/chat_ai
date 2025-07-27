import React from "react";
import { jsPDF } from "jspdf";
import "./Sidebar.css";

const Sidebar = ({ sessions = [], loadingSessions, activeSessionId, onSelectSession, onNewSession, onDeleteSession, chatMessages = [] }) => {
  const exportPDF = () => {
    if (!chatMessages.length) {
      alert("No chat messages to export.");
      return;
    }
    const pdf = new jsPDF();
    let y = 10;
    pdf.setFontSize(12);

    // Find active session title
    const activeSession = sessions.find(sess => sess.session_id === activeSessionId);
    const sessionTitle = activeSession ? activeSession.title || `Chat ${activeSession.session_id.slice(0, 6)}` : "Unknown Session";

    pdf.text(`Chat Session Export - ${sessionTitle}`, 10, y);
    y += 10;

    chatMessages.forEach((msg, index) => {
      const author = msg.role === "user" ? "You" : "Assistant";
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const lines = pdf.splitTextToSize(msg.content, 180);

      pdf.setFont(undefined, "bold");
      pdf.text(`${author} (${timestamp}):`, 10, y);
      y += 7;

      pdf.setFont(undefined, "normal");
      lines.forEach(line => {
        pdf.text(line, 10, y);
        y += 7;
        if (y > 280) {
          pdf.addPage();
          y = 10;
        }
      });
      y += 5;
    });

    pdf.save("chat-session.pdf");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Your Chats</h2>
        <button className="new-session-btn" onClick={onNewSession}>＋ New</button>
        <button className="export-pdf-btn" onClick={exportPDF}>Export PDF</button>
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
                {sess.is_personal ? (
                  <span title="Personal session" style={{ marginRight: 4 }}>
                    👤
                  </span>
                ) : (
                  <span title="Group or shared session" style={{ marginRight: 4 }}>
                    🤖
                  </span>
                )}
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
