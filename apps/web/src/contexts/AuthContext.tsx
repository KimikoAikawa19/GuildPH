import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, firebaseConfigured } from "../firebase";

type AuthContextValue = {
  firebaseUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | undefined>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setFirebaseUser(null);
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    if (!auth) throw new Error("Firebase Authentication is not configured.");
    await signOut(auth);
  };
  const getIdToken = async () => firebaseUser?.getIdToken();

  return (
    <AuthContext.Provider value={{ firebaseUser, loading, logout, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
