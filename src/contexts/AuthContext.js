import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setLoading(false);
        };
        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });
        init();
        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);
    const value = useMemo(() => ({
        session,
        user: session?.user ?? null,
        loading,
        signIn: async (email, password) => {
            setLoading(true);
            const { error, data } = await supabase.auth.signInWithPassword({ email, password });
            setSession(data.session);
            setLoading(false);
            if (error)
                throw error;
        },
        signUp: async (email, password) => {
            setLoading(true);
            const { error, data } = await supabase.auth.signUp({ email, password });
            setSession(data.session);
            setLoading(false);
            if (error)
                throw error;
        },
        signOut: async () => {
            setLoading(true);
            const { error } = await supabase.auth.signOut();
            setLoading(false);
            if (error)
                throw error;
            setSession(null);
        }
    }), [session, loading]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
