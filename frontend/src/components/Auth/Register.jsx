import React, { useState } from "react";
import "./Register.css";

const Register = ({ onToggle }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMsg("Registration successful! Please log in.");
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        setError(data.detail || data.message || "Registration failed.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="registerPage">
      <form className="authForm" onSubmit={handleRegister}>
        <h2 className="heading">Code_AI_ Register</h2>
        <input
          className="input"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <button className="button" type="submit">Register</button>
        {msg && <div className="info">{msg}</div>}
        {error && <div className="error">{error}</div>}
        <div className="toggleText">
          Already have an account?
          <span className="toggleLink" onClick={onToggle}> Login </span>
        </div>
      </form>
    </div>
  );
};

export default Register;
