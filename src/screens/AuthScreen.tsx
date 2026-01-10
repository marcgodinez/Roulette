import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';

import { COLORS, METRICS } from '../constants/theme';

export const AuthScreen = () => {
    const { signInWithEmail, signUpWithEmail, promptAsync } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.card}>

                        {/* HEADER */}
                        <Text style={styles.logo}>ROULETTE</Text>
                        <Text style={styles.subtitle}>{isLogin ? 'WELCOME BACK' : 'JOIN THE CLUB'}</Text>

                        {/* TOGGLE */}
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, isLogin && styles.activeToggle]}
                                onPress={() => setIsLogin(true)}
                            >
                                <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>SIGN IN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, !isLogin && styles.activeToggle]}
                                onPress={() => setIsLogin(false)}
                            >
                                <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>SIGN UP</Text>
                            </TouchableOpacity>
                        </View>

                        {/* FORM */}
                        <View style={styles.form}>
                            <Text style={styles.label}>EMAIL</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="vip@casino.com"
                                placeholderTextColor={COLORS.TEXT_MUTED}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />

                            <Text style={styles.label}>PASSWORD</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={COLORS.TEXT_MUTED}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color={COLORS.BG_MAIN} />
                                ) : (
                                    <Text style={styles.submitBtnText}>{isLogin ? 'ENTER CASINO' : 'CREATE ACCOUNT'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* SOCIAL AUTH PLACEHOLDER */}
                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>OR</Text>
                            <View style={styles.line} />
                        </View>

                        <TouchableOpacity
                            style={styles.googleBtn}
                            onPress={() => promptAsync()}
                            disabled={loading}
                        >
                            <Text style={styles.googleBtnText}>Continue with Google</Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BG_MAIN,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: METRICS.padding,
    },
    card: {
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
        padding: 30,
        // Remove heavy shadows for flat design, enable subtle border
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.ACCENT_GOLD,
        textAlign: 'center',
        marginBottom: 5,
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        marginBottom: 30,
        letterSpacing: 2,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.BG_MAIN,
        borderRadius: METRICS.borderRadius,
        marginBottom: 30,
        padding: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: METRICS.borderRadius - 4,
    },
    activeToggle: {
        backgroundColor: COLORS.ACCENT_GOLD,
    },
    toggleText: {
        color: COLORS.TEXT_MUTED,
        fontWeight: 'bold',
        fontSize: 12,
    },
    activeToggleText: {
        color: COLORS.BG_MAIN,
    },
    form: {
        marginBottom: 20,
    },
    label: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: COLORS.BG_MAIN,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        borderRadius: METRICS.borderRadius,
        color: COLORS.TEXT_PRIMARY,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    submitBtn: {
        backgroundColor: COLORS.ACCENT_GOLD,
        paddingVertical: 16,
        borderRadius: METRICS.borderRadius,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnText: {
        color: COLORS.BG_MAIN,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.BORDER_SUBTLE,
    },
    orText: {
        color: COLORS.TEXT_MUTED,
        marginHorizontal: 10,
        fontSize: 12,
        fontWeight: 'bold',
    },
    googleBtn: {
        backgroundColor: '#FFF',
        paddingVertical: 16,
        borderRadius: METRICS.borderRadius,
        alignItems: 'center',
    },
    googleBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
