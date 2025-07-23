import React, { useState } from "react";
import "./Login.css";

const Login = ({ onLoginSuccess, onToggle }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // You can replace this with your actual API call
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Example: replace with your backend endpoint/API logic!
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        // Instead of setting token in state or localStorage,
        // just notify parent that login succeeded
        onLoginSuccess();
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="loginPage">
      <form className="authForm" onSubmit={handleLogin}>
        <h2 className="heading">Code_AI_ Login</h2>
        <input
          className="input"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="button" type="submit">
          Log In
        </button>
        {error && <div className="error">{error}</div>}
        <div className="toggleText">
          Don't have an account?
          <span className="toggleLink" onClick={onToggle}>
            {" "}Register
          </span>
        </div>
      </form>
    </div>
  );
};

export default Login;
