/**
 * screens/AIAssistantScreen.tsx
 * AI Weather Assistant chat interface for WeatherWise AI.
 *
 * Day 27 Integration:
 *  - POST /api/v1/ai/ask — sends user question + current weather context
 *  - Chat-style message list (user question on right, AI response on left)
 *  - Each assistant response includes a reasoning line (UIUXDesignBrief §7.6)
 *  - Suggested follow-up questions shown after each response
 *  - Loading indicator while awaiting AI response
 */

import React from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { apiFetch } from '../services/api';
import { getCurrentLocation } from '../services/locationService';
import { getCurrentWeather } from '../services/weatherService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  reasoning?: string;
  suggestions?: string[];
  timestamp: Date;
}

interface AskResponse {
  answer: string;
  reasoning?: string;
  suggestions?: string[];
}

// ---------------------------------------------------------------------------
// Suggested starter questions
// ---------------------------------------------------------------------------

const STARTER_QUESTIONS = [
  'Can I go for a run at 5 PM?',
  'Should I carry an umbrella today?',
  'Is it safe to travel now?',
  'What should I wear today?',
  'Should I water my plants today?',
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UserBubble({ message }: { message: Message }) {
  return (
    <View style={styles.userBubbleWrapper}>
      <View style={styles.userBubble}>
        <Text style={styles.userBubbleText}>{message.text}</Text>
      </View>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  return (
    <View style={styles.assistantBubbleWrapper}>
      <View style={styles.assistantAvatar}>
        <Text style={styles.assistantAvatarText}>🤖</Text>
      </View>
      <View style={styles.assistantBubbleContent}>
        <View style={styles.assistantBubble}>
          <Text style={styles.assistantBubbleText}>{message.text}</Text>
          {message.reasoning ? (
            <View style={styles.reasoningRow}>
              <Text style={styles.reasoningIcon}>💡</Text>
              <Text style={styles.reasoningText}>{message.reasoning}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.assistantBubbleWrapper}>
      <View style={styles.assistantAvatar}>
        <Text style={styles.assistantAvatarText}>🤖</Text>
      </View>
      <View style={styles.typingBubble}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.typingText}>Thinking…</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function AIAssistantScreen() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const listRef = React.useRef<FlatList<Message>>(null);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = { ...msg, id: String(Date.now() + Math.random()), timestamp: new Date() };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const handleSend = React.useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setInput('');
    addMessage({ sender: 'user', text: trimmed });
    setIsTyping(true);

    try {
      // Gather weather context to ground the AI answer
      let weatherContext: Record<string, unknown> = {};
      try {
        const loc = await getCurrentLocation();
        const w = await getCurrentWeather(loc.latitude, loc.longitude);
        weatherContext = {
          location: loc.displayName,
          temperature_c: w.temperatureC,
          feels_like_c: w.feelsLikeC,
          condition: w.conditionLabel,
          humidity_percent: w.humidity,
          wind_speed_kmh: w.windSpeedKmh,
          uv_index: w.uvIndex,
          rain_probability_percent: w.rainProbability,
        };
      } catch {
        // Context is optional — assistant can still answer without live weather
      }

      const response = await apiFetch<AskResponse>('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question: trimmed, context: weatherContext }),
      });

      addMessage({
        sender: 'assistant',
        text: response.answer,
        reasoning: response.reasoning,
        suggestions: response.suggestions,
      });
    } catch (err) {
      addMessage({
        sender: 'assistant',
        text: err instanceof Error
          ? `I'm sorry — I couldn't get an answer right now. ${err.message}`
          : 'I'm sorry — something went wrong. Please try again.',
        reasoning: undefined,
      });
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  // Scroll to bottom when messages update
  React.useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isTyping]);

  const lastSuggestions =
    messages.length > 0 && messages[messages.length - 1].sender === 'assistant'
      ? messages[messages.length - 1].suggestions ?? []
      : [];

  const showStarters = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* ---- Header ---- */}
      <View style={styles.chatHeader}>
        <Text style={styles.chatHeaderTitle}>🤖 AI Weather Assistant</Text>
        <Text style={styles.chatHeaderSubtitle}>
          Ask me anything about today's weather.
        </Text>
      </View>

      {/* ---- Message list ---- */}
      <FlatList<Message>
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>☁️</Text>
            <Text style={styles.emptyChatText}>
              Ask me a weather question and I'll give you a grounded, weather-aware answer.
            </Text>
          </View>
        }
        renderItem={({ item }) =>
          item.sender === 'user' ? (
            <UserBubble message={item} />
          ) : (
            <AssistantBubble message={item} />
          )
        }
        ListFooterComponent={
          <>
            {isTyping && <TypingIndicator />}

            {/* Suggested follow-ups */}
            {lastSuggestions.length > 0 && !isTyping && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsRow}
              >
                {lastSuggestions.map((s) => (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [styles.suggestionChip, pressed && { opacity: 0.7 }]}
                    onPress={() => void handleSend(s)}
                    accessibilityRole="button"
                    accessibilityLabel={s}
                  >
                    <Text style={styles.suggestionChipText}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Starter questions */}
            {showStarters && (
              <View style={styles.startersContainer}>
                <Text style={styles.startersLabel}>Try asking:</Text>
                {STARTER_QUESTIONS.map((q) => (
                  <Pressable
                    key={q}
                    style={({ pressed }) => [styles.starterBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => void handleSend(q)}
                    accessibilityRole="button"
                    accessibilityLabel={q}
                  >
                    <Text style={styles.starterBtnText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        }
      />

      {/* ---- Input bar ---- */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask about the weather…"
          placeholderTextColor={COLORS.textSecondary}
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={() => void handleSend(input)}
          accessibilityLabel="Ask a weather question"
          multiline
          maxLength={500}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && { opacity: 0.8 },
            (!input.trim() || isTyping) && styles.sendBtnDisabled,
          ]}
          onPress={() => void handleSend(input)}
          disabled={!input.trim() || isTyping}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  chatHeader: {
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatHeaderTitle: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  chatHeaderSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  messageList: {
    padding: SPACING.m,
    gap: SPACING.s,
    flexGrow: 1,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.m,
  },
  emptyChatIcon: { fontSize: 48 },
  emptyChatText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.m * 1.5,
    maxWidth: 280,
  },

  // User bubble
  userBubbleWrapper: {
    alignItems: 'flex-end',
    marginBottom: SPACING.s,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    borderBottomRightRadius: BORDER_RADIUS.s,
    padding: SPACING.m,
    maxWidth: '80%',
    ...SHADOWS.subtle,
  },
  userBubbleText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    lineHeight: TYPOGRAPHY.fontSize.m * 1.4,
  },

  // Assistant bubble
  assistantBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.s,
    gap: SPACING.s,
  },
  assistantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assistantAvatarText: { fontSize: 18 },
  assistantBubbleContent: { flex: 1, gap: 2 },
  assistantBubble: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    borderBottomLeftRadius: BORDER_RADIUS.s,
    padding: SPACING.m,
    maxWidth: '90%',
    ...SHADOWS.subtle,
  },
  assistantBubbleText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    lineHeight: TYPOGRAPHY.fontSize.m * 1.4,
  },
  reasoningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.s,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.s,
    padding: SPACING.s,
  },
  reasoningIcon: { fontSize: 13 },
  reasoningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.5,
  },

  // Typing
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    gap: SPACING.s,
    alignSelf: 'flex-start',
  },
  typingText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s },

  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginHorizontal: SPACING.xs,
  },

  // Suggestions
  suggestionsRow: {
    gap: SPACING.s,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.xs,
  },
  suggestionChip: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
  },
  suggestionChipText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Starters
  startersContainer: {
    gap: SPACING.s,
    marginTop: SPACING.m,
  },
  startersLabel: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.xs,
  },
  starterBtn: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
  },
  starterBtnText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.m,
    gap: SPACING.s,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.fontSize.xl,
  },
});
