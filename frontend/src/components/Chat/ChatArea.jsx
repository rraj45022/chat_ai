import React, { useEffect, useState, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import "./ChatArea.css";

const ChatArea = ({ sessionId, token, chatRef, setChatMessages }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update parent chatMessages state for PDF export
  useEffect(() => {
    setChatMessages(messages);
  }, [messages, setChatMessages]);

  // Fetch conversation on mount/session change
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/chat_history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ session_id: sessionId }),
          credentials: "include",
        });
        const data = await res.json();
        setMessages(data.conversation || []);
      } catch (e) {
        setMessages([]);
      }
      setLoading(false);
    };
    if (sessionId) fetchHistory();
  }, [sessionId]);

  // Send new message to backend and update UI
  const handleSend = async (text) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: sessionId, message: text }),
        credentials: "include",
      });
      const data = await res.json();
      setMessages(data.conversation || []);
    } catch (e) {
      // Optional: show error to user
    }
    setLoading(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="chatArea">
      <input
        type="text"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="chat-search-input"
      />
      <div className="chatMessages" ref={chatRef}>
        {loading && <div className="chatLoading">Waiting for assistant...</div>}
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            searchQuery={searchQuery}
          />
        ))}
        <div ref={chatEndRef} />
      </div>
      <MessageInput
        onSend={handleSend}
        disabled={loading}
        token={token}
        sessionId={sessionId}
      />
    </div>
  );
};

export default ChatArea;
