import React from 'react';
import { createContext, useEffect, useState, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, getUserData } from "./firebase";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async u => {
    if (u) { setUser(u); setData(await getUserData(u.uid)); } else { setUser(null); setData(null); }
    setLoading(false);
  }), []);

  return <AuthContext.Provider value={{ user, data, loading }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);