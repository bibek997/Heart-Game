import axios from "axios";
const BASE = import.meta.env.VITE_HEART_API || "http://localhost:4000";
export const fetchPuzzle = async () => (await axios.get(`${BASE}/api/new?base64=yes`)).data;
export const validateGuess = async (token, guess) => (await axios.post(`${BASE}/api/validate`, { gameToken: token, guess })).data;