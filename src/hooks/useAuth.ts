import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { Alert } from 'react-native';
import { Config } from '../config/Config';

WebBrowser.maybeCompleteAuthSession();

export const useAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);
        if (error) throw error;
    };

    const signUpWithEmail = async (email: string, password: string) => {
        console.warn("[SignUp] Starting sign up for:", email);
        setLoading(true);
        try {
            console.warn("[SignUp] Calling supabase.auth.signUp...");
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            console.warn("[SignUp] Response received.");
            if (error) {
                console.error("[SignUp] Error Details:", JSON.stringify(error, null, 2));
                console.error("[SignUp] Error Message:", error.message);
                throw error;
            }

            console.warn("[SignUp] Success. Data:", JSON.stringify(data, null, 2));
            Alert.alert('Verification Sent', 'Please check your email to verify your account.');
        } catch (err: any) {
            console.error("[SignUp] Exception Caught:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        setLoading(false);
        if (error) throw error;
    };

    // Google Auth Configuration
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: Config.GOOGLE_ANDROID_CLIENT_ID,
        iosClientId: Config.GOOGLE_IOS_CLIENT_ID,
        webClientId: Config.GOOGLE_WEB_CLIENT_ID,
        redirectUri: makeRedirectUri({
            scheme: 'megafirern'
        }),
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.idToken) {
                signInWithGoogle(authentication.idToken);
            }
        }
    }, [response]);

    const signInWithGoogle = async (idToken: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
        });
        setLoading(false);
        if (error) {
            Alert.alert('Google Sign-In Error', error.message);
        }
    };

    return {
        session,
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        promptAsync, // Expose this to trigger the flow
    };
};
