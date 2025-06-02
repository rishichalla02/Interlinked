import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.js';
import { useUserStore } from './lib/userStore.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            useUserStore.getState().fetchUserInfo(user.uid);
        } else {
            // User is signed out
            useUserStore.getState().set({ currentUser: null, isLoading: false });
        }
    });

    return () => unsubscribe();
}, []);
