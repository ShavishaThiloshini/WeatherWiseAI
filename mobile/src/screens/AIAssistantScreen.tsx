import React from 'react';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { askAssistant, type AssistantMessage } from '../services/api';

type ChatMessage = AssistantMessage & {
  id: string;
  meta?: string;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AIAssistantScreen() {
  const starterMessages = useMemo<ChatMessage[]>(
    () => [
      {
        id: createId(),
        role: 'assistant',
        content:
          'Ask me things like: “Can I run at 5 PM?” or “Should I carry an umbrella today?”',
        meta: 'Local Ollama model',
      },
    ],
    [],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await askAssistant(trimmed, {
        location: 'Current location',
        currentWeather: {
          temperatureC: 29,
          feelsLikeC: 33,
          humidity: 72,
          windSpeedKmh: 14,
          uvIndex: 7,
          rainProbability: 40,
          conditionLabel: 'Partly Cloudy',
        },
        forecastSummary: 'Warm afternoon with a chance of rain later in the day.',
        activeAlerts: [],
      });

      const assistantText = [
        response.answer,
        response.reasoning ? `Why: ${response.reasoning}` : '',
        response.safety ? `Safety: ${response.safety}` : '',
        response.suggestedAction ? `Next: ${response.suggestedAction}` : '',
        response.isFallback ? `Model: ${response.model} (fallback)` : `Model: ${response.model}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: assistantText,
          meta: response.provider,
        },
      ]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to reach the assistant.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>🤖</Text>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Local Ollama chat powered by your backend.</Text>
        </View>

        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.bubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={styles.roleLabel}>{message.role === 'user' ? 'You' : 'Assistant'}</Text>
              <Text style={styles.messageText}>{message.content}</Text>
              {message.meta ? <Text style={styles.metaText}>{message.meta}</Text> : null}
            </View>
          ))}

          {loading ? (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Thinking with Ollama...</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about weather, rain, travel, or safety"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            editable={!loading}
            multiline
          />
          <Pressable style={styles.sendButton} onPress={handleSend} disabled={loading}>
            <Text style={styles.sendButtonText}>{loading ? '...' : 'Send'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: SPACING.m,
  },
  emoji: {
    fontSize: 42,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: SPACING.m,
  },
  bubble: {
    borderRadius: 18,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    maxWidth: '92%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  messageText: {
    fontSize: TYPOGRAPHY.fontSize.m,
    lineHeight: TYPOGRAPHY.fontSize.m * 1.5,
    color: COLORS.textPrimary,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  loadingText: {
    marginTop: SPACING.s,
    color: COLORS.textSecondary,
  },
  errorText: {
    color: COLORS.danger,
    marginTop: SPACING.s,
  },
  inputBar: {
    flexDirection: 'row',
    gap: SPACING.s,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.s,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  sendButton: {
    minHeight: 48,
    paddingHorizontal: SPACING.l,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
