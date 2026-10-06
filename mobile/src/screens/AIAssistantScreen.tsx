import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { getCurrentLocation, listSavedLocations, type SavedLocation } from '../services/locationService';
import { askWeatherAssistant, type AssistantWeatherContext } from '../services/assistantService';
import { getCurrentWeather } from '../services/weatherService';
import type { LocationData, WeatherData } from '../types';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  createdAt: Date;
  failed?: boolean;
  retryQuestion?: string;
}

const SUGGESTED_QUESTIONS = [
  'Should I bring an umbrella?',
  'Is it a good time to go for a walk?',
  'What should I wear today?',
];

function toLocationData(location: SavedLocation): LocationData {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    city: location.label,
    region: '',
    country: '',
    displayName: location.label,
  };
}

function createMessage(role: ChatMessage['role'], content: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
    createdAt: new Date(),
    ...extra,
  };
}

function toWeatherContext(location: LocationData, weather: WeatherData): AssistantWeatherContext {
  return {
    location: {
      label: location.displayName,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    current: {
      temperature_c: weather.temperatureC,
      feels_like_c: weather.feelsLikeC,
      humidity_percent: weather.humidity,
      wind_speed_kmh: weather.windSpeedKmh,
      uv_index: weather.uvIndex,
      rain_probability_percent: weather.rainProbability,
      condition: weather.condition,
    },
  };
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function AIAssistantScreen() {
  const [weatherContext, setWeatherContext] = React.useState<AssistantWeatherContext | null>(null);
  const [weatherLabel, setWeatherLabel] = React.useState('');
  const [contextLoading, setContextLoading] = React.useState(true);
  const [contextError, setContextError] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    createMessage(
      'assistant',
      'Hi! I’m your WeatherWise assistant. Ask me anything about the weather, what to wear, or planning an outdoor activity.',
    ),
  ]);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const sendingRef = React.useRef(false);
  const listRef = React.useRef<FlatList<ChatMessage>>(null);

  const loadWeatherContext = React.useCallback(async () => {
    setContextLoading(true);
    setContextError(null);
    setWeatherContext(null);

    try {
      let location: LocationData;
      try {
        const savedLocations = await listSavedLocations();
        const defaultLocation = savedLocations.find((savedLocation) => savedLocation.isDefault);
        location = defaultLocation ? toLocationData(defaultLocation) : await getCurrentLocation();
      } catch {
        location = await getCurrentLocation();
      }

      const weather = await getCurrentWeather(location.latitude, location.longitude);
      setWeatherLabel(location.displayName);
      setWeatherContext(toWeatherContext(location, weather));
    } catch (error) {
      setContextError(error instanceof Error ? error.message : 'Could not load weather for your location.');
    } finally {
      setContextLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadWeatherContext();
    }, [loadWeatherContext]),
  );

  React.useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, sending]);

  const sendQuestion = React.useCallback(async (question: string, addUserMessage = true) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || trimmedQuestion.length > 300 || !weatherContext || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    if (addUserMessage) {
      setMessages((current) => [...current, createMessage('user', trimmedQuestion)]);
    }
    setDraft('');

    try {
      const response = await askWeatherAssistant(trimmedQuestion, weatherContext);
      setMessages((current) => [...current, createMessage('assistant', response.answer)]);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'I couldn’t reach the assistant. Please try again.';
      setMessages((current) => [
        ...current,
        createMessage('assistant', errorMessage, { failed: true, retryQuestion: trimmedQuestion }),
      ]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [weatherContext]);

  const retryQuestion = React.useCallback((message: ChatMessage) => {
    if (!message.retryQuestion) return;
    setMessages((current) => current.filter((item) => item.id !== message.id));
    void sendQuestion(message.retryQuestion, false);
  }, [sendQuestion]);

  const canSend = Boolean(weatherContext) && !contextLoading && !sending && draft.trim().length > 0;

  return (
    <ScreenContainer contentStyle={styles.screenContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <View style={styles.assistantAvatar}>
            <Text style={styles.avatarEmoji}>✦</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.assistantName}>WeatherWise AI</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, contextLoading && styles.loadingDot]} />
              <Text style={styles.onlineText}>
                {contextLoading ? 'Checking local weather' : weatherContext ? 'Ready to help' : 'Weather unavailable'}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh local weather"
            style={styles.refreshButton}
            onPress={() => void loadWeatherContext()}
            disabled={contextLoading}
          >
            {contextLoading
              ? <ActivityIndicator size="small" color={COLORS.textSecondary} />
              : <Text style={styles.refreshIcon}>↻</Text>}
          </Pressable>
        </View>

        <View style={styles.weatherContext}>
          <Text style={styles.contextIcon}>📍</Text>
          <View style={styles.contextCopy}>
            <Text style={styles.contextTitle} numberOfLines={1}>
              {weatherLabel || (contextLoading ? 'Getting your location…' : 'Local weather')}
            </Text>
            <Text style={styles.contextSubtitle}>
              {contextLoading
                ? 'Preparing current conditions'
                : weatherContext
                  ? 'Answers use current conditions here'
                  : 'Location weather is needed to answer'}
            </Text>
          </View>
          {weatherContext ? <Text style={styles.contextCheck}>✓</Text> : null}
        </View>

        {contextError ? (
          <View style={styles.contextError} accessibilityRole="alert">
            <Text style={styles.contextErrorText}>{contextError}</Text>
            <Pressable onPress={() => void loadWeatherContext()} accessibilityRole="button">
              <Text style={styles.contextRetry}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.role === 'user' && styles.userMessageRow]}>
              {item.role === 'assistant' ? (
                <View style={styles.messageAvatar}>
                  <Text style={styles.messageAvatarText}>✦</Text>
                </View>
              ) : null}
              <View style={styles.messageColumn}>
                <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>
                    {item.content}
                  </Text>
                </View>
                <View style={[styles.messageMeta, item.role === 'user' && styles.userMessageMeta]}>
                  <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
                  {item.failed && item.retryQuestion ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Retry sending your question"
                      onPress={() => retryQuestion(item)}
                      style={styles.retryMessageButton}
                    >
                      <Text style={styles.retryMessageText}>↻ Try again</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={sending ? (
            <View style={styles.typingRow}>
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>✦</Text>
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={COLORS.primaryLight} />
                <Text style={styles.typingText}>Thinking…</Text>
              </View>
            </View>
          ) : null}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {messages.length === 1 ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>TRY ASKING</Text>
            <View style={styles.suggestionList}>
              {SUGGESTED_QUESTIONS.map((question) => (
                <Pressable
                  key={question}
                  accessibilityRole="button"
                  style={[styles.suggestionChip, (!weatherContext || contextLoading || sending) && styles.disabledChip]}
                  disabled={!weatherContext || contextLoading || sending}
                  onPress={() => void sendQuestion(question)}
                >
                  <Text style={styles.suggestionText}>{question}</Text>
                  <Text style={styles.suggestionArrow}>›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.composerWrap}>
          <View style={[styles.composer, !weatherContext && styles.composerDisabled]}>
            <TextInput
              accessibilityLabel="Ask the WeatherWise assistant"
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={contextLoading ? 'Preparing local weather…' : 'Ask about your weather…'}
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={300}
              editable={Boolean(weatherContext) && !contextLoading && !sending}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => void sendQuestion(draft)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              disabled={!canSend}
              onPress={() => void sendQuestion(draft)}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>
            Weather guidance only · {draft.length}/300
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContainer: { padding: 0 },
  keyboardView: { flex: 1, paddingHorizontal: SPACING.m },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  assistantAvatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOWS.subtle,
  },
  avatarEmoji: { color: COLORS.white, fontSize: 25, fontWeight: TYPOGRAPHY.fontWeight.bold },
  headerCopy: { flex: 1, marginLeft: SPACING.s },
  assistantName: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.bold },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  onlineDot: { width: 7, height: 7, borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.success, marginRight: 6 },
  loadingDot: { backgroundColor: COLORS.warning },
  onlineText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs },
  refreshButton: { width: 40, height: 40, borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { color: COLORS.textSecondary, fontSize: 26, lineHeight: 30 },
  weatherContext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
  },
  contextIcon: { fontSize: 18, marginRight: SPACING.s },
  contextCopy: { flex: 1 },
  contextTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  contextSubtitle: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 2 },
  contextCheck: { color: COLORS.success, fontWeight: TYPOGRAPHY.fontWeight.bold, fontSize: TYPOGRAPHY.fontSize.l, marginLeft: SPACING.s },
  contextError: { backgroundColor: '#3B1D2A', borderRadius: BORDER_RADIUS.s, padding: SPACING.s, marginBottom: SPACING.s },
  contextErrorText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xs, lineHeight: 17 },
  contextRetry: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold, marginTop: SPACING.xs },
  messageList: { flex: 1 },
  messageListContent: { flexGrow: 1, justifyContent: 'flex-end', paddingTop: SPACING.m, paddingBottom: SPACING.s },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.m },
  userMessageRow: { justifyContent: 'flex-end' },
  messageAvatar: { width: 28, height: 28, borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.primaryDark, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.xs, marginBottom: 20 },
  messageAvatarText: { color: COLORS.white, fontSize: 16, fontWeight: TYPOGRAPHY.fontWeight.bold },
  messageColumn: { maxWidth: '82%' },
  bubble: { borderRadius: BORDER_RADIUS.l, paddingHorizontal: SPACING.m, paddingVertical: SPACING.s },
  assistantBubble: { backgroundColor: COLORS.backgroundCard, borderBottomLeftRadius: BORDER_RADIUS.s },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: BORDER_RADIUS.s },
  messageText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 21 },
  userMessageText: { color: COLORS.white },
  messageMeta: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs },
  userMessageMeta: { justifyContent: 'flex-end' },
  timeText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs },
  retryMessageButton: { marginLeft: SPACING.s, paddingVertical: 2, paddingHorizontal: SPACING.xs },
  retryMessageText: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.s },
  typingBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.l, paddingHorizontal: SPACING.m, paddingVertical: SPACING.s },
  typingText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginLeft: SPACING.s },
  suggestions: { paddingBottom: SPACING.s },
  suggestionsTitle: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, letterSpacing: 1, fontWeight: TYPOGRAPHY.fontWeight.bold, marginBottom: SPACING.s },
  suggestionList: { gap: SPACING.xs },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderColor: COLORS.border, borderWidth: 1, borderRadius: BORDER_RADIUS.m, paddingHorizontal: SPACING.m, paddingVertical: SPACING.s },
  disabledChip: { opacity: 0.5 },
  suggestionText: { flex: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s },
  suggestionArrow: { color: COLORS.primaryLight, fontSize: TYPOGRAPHY.fontSize.xl, marginLeft: SPACING.s },
  composerWrap: { paddingTop: SPACING.s, paddingBottom: SPACING.s, borderTopWidth: 1, borderTopColor: COLORS.border },
  composer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xs, minHeight: 50 },
  composerDisabled: { opacity: 0.65 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 21, maxHeight: 100, paddingHorizontal: SPACING.s, paddingTop: SPACING.s, paddingBottom: SPACING.s },
  sendButton: { width: 38, height: 38, borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.xs },
  sendButtonDisabled: { backgroundColor: COLORS.border },
  sendIcon: { color: COLORS.white, fontSize: 24, lineHeight: 28, fontWeight: TYPOGRAPHY.fontWeight.bold },
  disclaimer: { textAlign: 'center', color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs },
});
