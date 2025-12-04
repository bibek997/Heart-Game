import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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