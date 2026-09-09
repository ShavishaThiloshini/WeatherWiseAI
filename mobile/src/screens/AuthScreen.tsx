import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { loginUser, registerUser } from '../services/authService';

export function AuthScreen({ onAuthenticate }: { onAuthenticate: (token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === 'register' && !name.trim()) {
      Alert.alert('Name required', 'Enter your name to create an account.');
      return;
    }

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      Alert.alert('Email required', 'Enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Password too short', 'Your password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = mode === 'register'
        ? await registerUser(name.trim(), normalizedEmail, password)
        : await loginUser(normalizedEmail, password);

      onAuthenticate(result.token);
    } catch (error) {
      Alert.alert('Unable to continue', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.brandMark}>
          <Text style={styles.brandIcon}>☼</Text>
        </View>
        <Text style={styles.eyebrow}>WEATHERWISE AI</Text>
        <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Plan your day with confidence'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to see weather advice made for you.' : 'Create an account for personal weather recommendations.'}
        </Text>

        {mode === 'register' && (
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Your name"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              accessibilityLabel="Name"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            keyboardAppearance="dark"
            returnKeyType="next"
            accessibilityLabel="Email address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="At least 6 characters"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              accessibilityLabel="Password"
            />
            <Pressable
              onPress={() => setShowPassword((visible) => !visible)}
              style={styles.visibilityButton}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={COLORS.secondary}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={mode === 'login' ? 'Log in' : 'Create account'}
        >
          {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={styles.toggleButton}
          accessibilityRole="button"
        >
          <Text style={styles.toggleText}>
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    padding: SPACING.l,
    paddingBottom: SPACING.xxl,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 560,
  },
  brandMark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.round,
    height: 64,
    justifyContent: 'center',
    marginBottom: SPACING.m,
    width: 64,
  },
  brandIcon: {
    color: COLORS.background,
    fontSize: 38,
    lineHeight: 42,
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    lineHeight: 22,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
    marginTop: SPACING.s,
    textAlign: 'center',
  },
  field: {
    marginBottom: SPACING.m,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.s,
  },
  input: {
    backgroundColor: COLORS.backgroundCard,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.m,
    fontSize: TYPOGRAPHY.fontSize.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    color: COLORS.textPrimary,
    minHeight: 52,
  },
  passwordRow: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  passwordInput: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
  },
  visibilityButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.m,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    minHeight: 52,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.s,
    ...SHADOWS.subtle,
  },
  buttonPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  toggleText: {
    color: COLORS.primaryLight,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  toggleButton: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: SPACING.m,
  },
});
