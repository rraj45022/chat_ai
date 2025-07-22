import React, { useState, useRef } from "react";
import "./ChatArea.css";

const MessageInput = ({ onSend, disabled, token }) => {
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  // Start audio recording
  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };
    mediaRecorderRef.current.onstop = async () => {
      setRecording(false);
      if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      }
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      // Transcribe with backend
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      // you can add sessionId/token to headers/form if you need auth/context
      const res = await fetch("http://localhost:8000/transcribe/", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          // Authorization: `Bearer ${token}`,
        }
      });
      const data = await res.json();
      setInput(data.transcript || "");
    };
    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
  };

  const handleMicClick = () => {
    if (recording) stopRecording();
    else startRecording();
  };

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
      <button type="button" onClick={handleMicClick} disabled={disabled} style={{ marginLeft: 8 }}>
        {recording ? "🛑" : "🎤"}
      </button>
      <button className="messageSendBtn" type="submit" disabled={disabled || !input.trim()}>
        Send
      </button>
    </form>
  );
};

export default MessageInput;
