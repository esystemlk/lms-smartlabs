"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserData, UserRole } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

const DEVELOPER_EMAILS = [
  "tikfese@gmail.com",
  "thimira.vishwa2003@gmail.com"
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        // Real-time listener for user data
        const unsubscribeSnapshot = onSnapshot(doc(db, "users", authUser.uid), async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as UserData;
            
            // Check if user should be a developer but isn't
            if (DEVELOPER_EMAILS.includes(authUser.email || "") && data.role !== "developer") {
              await setDoc(doc(db, "users", authUser.uid), { 
                ...data, 
                role: "developer" 
              }, { merge: true });
              // The snapshot will fire again with the update
            } else {
              setUserData(data);
            }
          } else {
            setUserData(null);
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
