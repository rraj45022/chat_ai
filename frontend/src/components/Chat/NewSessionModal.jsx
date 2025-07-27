import React, { useState } from "react";
import "./NewSessionModal.css";

const NewSessionModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState("");
  const [isPersonal, setIsPersonal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a session name.");
      return;
    }
    onCreate(title.trim(), isPersonal);
    setTitle("");
    setIsPersonal(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Session</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Session Name:
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={isPersonal}
              onChange={(e) => setIsPersonal(e.target.checked)}
            />
            Use this session just to keep personal messages 
          </label>
          <div className="modal-buttons">
            <button type="submit">Create</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSessionModal;
