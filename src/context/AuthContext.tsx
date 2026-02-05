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
  impersonateRole: (role: UserRole) => void;
  stopImpersonating: () => void;
  isImpersonating: boolean;
  originalRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  impersonateRole: () => {},
  stopImpersonating: () => {},
  isImpersonating: false,
  originalRole: null,
});

const DEVELOPER_EMAILS = [
  "tikfese@gmail.com",
  "thimira.vishwa2003@gmail.com"
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Impersonation State
  const [impersonatedRole, setImpersonatedRole] = useState<UserRole | null>(null);

  const impersonateRole = (role: UserRole) => {
    setImpersonatedRole(role);
  };

  const stopImpersonating = () => {
    setImpersonatedRole(null);
  };

  // Derived user data with impersonation
  const activeUserData = userData ? {
    ...userData,
    role: impersonatedRole || userData.role
  } : null;

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      // Unsubscribe from previous listener if exists
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      setUser(authUser);
      
      if (authUser) {
        // Real-time listener for user data
        unsubscribeSnapshot = onSnapshot(doc(db, "users", authUser.uid), async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as UserData;
            
            // Check if user should be a developer but isn't
            if (DEVELOPER_EMAILS.includes(authUser.email || "") && data.role !== "developer") {
              const updatedData: UserData = { ...data, role: "developer" };
              await setDoc(doc(db, "users", authUser.uid), updatedData, { merge: true });
              setUserData(updatedData);
            } else {
              setUserData(data);
            }
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData: activeUserData, 
      loading,
      impersonateRole,
      stopImpersonating,
      isImpersonating: !!impersonatedRole,
      originalRole: userData?.role || null
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
