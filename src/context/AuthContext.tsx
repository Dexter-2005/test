import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    type User,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Capture auth locally to allow TS narrowing
    const currentAuth = auth;

    useEffect(() => {
        if (!currentAuth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(currentAuth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentAuth]);

    const signInWithGoogle = async () => {
        if (!currentAuth) {
            alert("Firebase Authentication is not configured. Please see src/firebase/firebase.ts");
            return;
        }
        try {
            await signInWithPopup(currentAuth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logOut = async () => {
        if (!currentAuth) return;
        try {
            await signOut(currentAuth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
