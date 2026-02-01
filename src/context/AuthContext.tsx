import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    type User,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';

interface LocalUser {
    displayName: string;
    email: string;
    photoURL?: string;
}

interface AuthContextType {
    user: User | null;
    localUser: LocalUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInLocal: (name: string, email: string) => void;
    logOut: () => Promise<void>;
    isLoggedIn: boolean;
    userName: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [localUser, setLocalUser] = useState<LocalUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Capture auth locally to allow TS narrowing
    const currentAuth = auth;

    useEffect(() => {
        // Check for local user in localStorage
        const storedUser = localStorage.getItem('algocanvas_user');
        if (storedUser) {
            setLocalUser(JSON.parse(storedUser));
        }

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
            // Clear local user if signing in with Google
            setLocalUser(null);
            localStorage.removeItem('algocanvas_user');
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const signInLocal = (name: string, email: string) => {
        const newLocalUser: LocalUser = {
            displayName: name,
            email: email,
            photoURL: undefined
        };
        setLocalUser(newLocalUser);
        localStorage.setItem('algocanvas_user', JSON.stringify(newLocalUser));
    };

    const logOut = async () => {
        // Clear local user
        setLocalUser(null);
        localStorage.removeItem('algocanvas_user');

        if (!currentAuth) return;
        try {
            await signOut(currentAuth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const isLoggedIn = !!(user || localUser);
    const userName = user?.displayName || localUser?.displayName || null;

    return (
        <AuthContext.Provider value={{ user, localUser, loading, signInWithGoogle, signInLocal, logOut, isLoggedIn, userName }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
