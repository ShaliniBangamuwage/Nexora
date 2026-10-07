// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../services/firebase";
import API_BASE_URL from '../config/api';

const AuthContext = createContext();

async function resolveSession(profile = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in is required to resolve your account.');
  const token = await user.getIdToken(true);
  const response = await fetch(`${API_BASE_URL}/auth/session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || 'Could not resolve your account.');
  }
  return result.user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user
  const register = async (userData) => {
    try {
      const { fullName, email, password, phone } = userData;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const profile = await resolveSession({ fullName, phone });
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userRole', profile.role);
      sessionStorage.setItem('userName', profile.fullName || fullName);
      sessionStorage.setItem('userEmail', profile.email || email);
      setUser(user);
      setCurrentUser(user);
      setUserRole(profile.role);
      return { success: true, user: { ...profile, uid: user.uid } };
    } catch (error) {
      if (error.code !== 'auth/email-already-in-use') {
        console.error('Registration error:', error);
      }
      let message = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') message = 'Email already registered';
      else if (error.code === 'auth/weak-password')   message = 'Password too weak';
      else if (error.code === 'auth/invalid-email')   message = 'Invalid email address';
      throw new Error(message);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userData = await resolveSession();

      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userRole', userData.role);
      sessionStorage.setItem('userName', userData.fullName || userData.name);
      sessionStorage.setItem('userEmail', userData.email);
      setUser(user);
      setCurrentUser(user);
      setUserRole(userData.role);

      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          role: userData.role,
          ...userData
        }
      };
    } catch (error) {
      if (auth.currentUser) await signOut(auth).catch(() => undefined);
      console.error('Login error:', error);
      
      let message = 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (error.message.includes('not found')) {
        message = error.message;
      }
      
      throw new Error(message);
    }
  };
  // Login with Google
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userData = await resolveSession({
        fullName: user.displayName || '',
        phone: user.phoneNumber || '',
      });
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userRole', userData.role);
      sessionStorage.setItem('userName', userData.fullName || userData.name);
      sessionStorage.setItem('userEmail', userData.email);
      setUser(user);
      setCurrentUser(user);
      setUserRole(userData.role);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          role: userData.role,
          ...userData,
        },
      };
    } catch (error) {
      if (auth.currentUser) await signOut(auth).catch(() => undefined);
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Reset password — sends a Firebase password reset email
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error.code, error.message);
      throw error; // re-throw so callers can read error.code
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.clear();
      setUser(null);
      setCurrentUser(null);
      setUserRole(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  };

  // Get current user's full data
  const getCurrentUserData = async () => {
    if (!currentUser) return null;

    try {
      return await resolveSession();
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setCurrentUser(currentUser);

        try {
          const profile = await resolveSession();
          if (auth.currentUser?.uid !== currentUser.uid) return;
          sessionStorage.setItem('userId', currentUser.uid);
          sessionStorage.setItem('userRole', profile.role);
          sessionStorage.setItem('userName', profile.fullName || profile.name || '');
          sessionStorage.setItem('userEmail', profile.email || currentUser.email || '');
          setUserRole(profile.role);
        } catch (error) {
          console.error('Could not resolve authenticated account:', error.message);
          await signOut(auth).catch(() => undefined);
          sessionStorage.clear();
          setUser(null);
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setCurrentUser(null);
        setUserRole(null);
        sessionStorage.clear();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    currentUser,
    userRole,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    getCurrentUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}