// src/api/auth.js
import axios from "axios";

export const login = async (username, password) => {
  const res = await axios.post("/api/login", { username, password });
  return res.data; // { token: "" }
};

export const register = async (username, password) => {
  const res = await axios.post("/api/register", { username, password });
  return res.data;
};
