import React, { useState } from "react";
import "./ChatArea.css";

const MessageInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <form className="messageInputForm" onSubmit={handleSubmit}>
      <input
        className="messageInput"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type your prompt..."
        disabled={disabled}
        autoFocus
      />
      <button className="messageSendBtn" type="submit" disabled={disabled || !input.trim()}>
        Send
      </button>
    </form>
  );
};

export default MessageInput;
