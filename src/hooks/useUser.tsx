/*
----- useUser hook for getting userContext -----
*/

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../../firebaseConfig";

// Contains user and loading for auth
type UserContextType = {
  user: User | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Getting auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // Once auth is succesfull set loading to false
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
