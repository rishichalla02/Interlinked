import { doc, getDoc } from 'firebase/firestore';
import { create } from 'zustand'
import { db, auth } from './firebase';

export const useUserStore = create((set) => ({
    currentUser: null,
    isLoading: true,
    
    fetchUserInfo: async (uid) => {
        if (!uid) return set({ currentUser: null, isLoading: false });

        try {
            // Wait a bit for auth to initialize if needed
            if (!auth.currentUser) {
                console.log('No authenticated user found');
                return set({ currentUser: null, isLoading: false });
            }

            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                set({ currentUser: { id: uid, ...docSnap.data() }, isLoading: false });
            } else {
                console.log('User document not found');
                set({ currentUser: null, isLoading: false });
            }

        } catch (err) {
            console.error('Error fetching user info:', err);
            
            // More specific error handling
            if (err.code === 'permission-denied') {
                console.error('Permission denied - check Firestore rules');
            } else if (err.code === 'unauthenticated') {
                console.error('User not authenticated');
            }
            
            return set({ currentUser: null, isLoading: false });
        }
    }
}))