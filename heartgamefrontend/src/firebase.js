import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "heart-game-5d25a.firebaseapp.com",
  projectId: "heart-game-5d25a",
  storageBucket: "heart-game-5d25a.firebasestorage.app",
  messagingSenderId: "986794767256",
  appId: "1:986794767256:web:a7fa3c7ff4968c5e4ff1ed",
  measurementId: "G-4KYFRVKEJW"
});

export const auth = getAuth(app);
export const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence);

export const register = async ({ name, email, password }) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  await setDoc(doc(db, "users", user.uid), { name, email, bestScore: 0, createdAt: Date.now() });
  return user;
};

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const getUserData = async (uid) => (await getDoc(doc(db, "users", uid))).data();
export const updateUserScore = async (uid, score, best, streak) =>
  setDoc(doc(db, "users", uid), { lastScore: score, bestScore: best, streak, lastPlayed: Date.now() }, { merge: true });

export const fetchTop10 = async () => {
  const snap = await getDocs(query(collection(db, "users"), orderBy("bestScore", "desc"), limit(10)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};