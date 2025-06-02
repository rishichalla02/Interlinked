import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.js';
import { useUserStore } from './lib/userStore.js';

// Create a wrapper component for authentication
const AuthProvider = ({ children }) => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        useUserStore.getState().fetchUserInfo(user.uid);
      } else {
        // User is signed out
        useUserStore.setState({ currentUser: null, isLoading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)