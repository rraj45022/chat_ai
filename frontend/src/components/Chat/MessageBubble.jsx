import React from "react";
import "./ChatArea.css";

// Function to split content into text and code blocks based on fenced code blocks (```).
function parseContent(content) {
  // Updated regex to handle optional language tag after ```
  const regex = /```(?:\w+)?\n?([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.substring(lastIndex, match.index) });
    }
    parts.push({ type: "code", content: match[1].trim() });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.substring(lastIndex) });
  }
  return parts;
}

const MessageBubble = ({ role, content, timestamp }) => {
  const parsedContent = parseContent(content);

  return (
    <div className={`bubble ${role === "user" ? "user" : "assistant"}`}>
      <div className="bubble-author">{role === "user" ? "You" : "Assistant"}</div>
      <div className="bubble-timestamp">{new Date(timestamp).toLocaleString()}</div>
      <div className="bubble-content">
        {parsedContent.map((part, index) =>
          part.type === "code" ? (
            <pre key={index} className="bubble-code">{part.content}</pre>
          ) : (
            <span key={index}>{part.content}</span>
          )
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
