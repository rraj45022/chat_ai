import React from "react";
import "./ChatArea.css";

// Simple code block detection
function hasCode(text) {
  return /``````/gs.test(text) || text.trim().startsWith("def ") || text.trim().startsWith("class ");
}

const MessageBubble = ({ role, content, timestamp }) => {
  // console.log("MessageBubble timestamp:", timestamp);

  return (
    <div className={`bubble ${role === "user" ? "user" : "assistant"}`}>
      <div className="bubble-author">{role === "user" ? "You" : "Assistant"}</div>
      <div className="bubble-timestamp">{new Date(timestamp).toLocaleString()}</div>
      <div className="bubble-content">
        {hasCode(content)
          ? <pre className="bubble-code">{content}</pre>
          : <span>{content}</span>
        }
      </div>
    </div>
  );
};

export default MessageBubble;
