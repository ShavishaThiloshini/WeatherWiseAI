import React, { useCallback, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { askWeatherQuestion } from '../services/assistantService';
import { getCurrentLocation, listSavedLocations } from '../services/locationService';
import { getCurrentWeather, getForecast } from '../services/weatherService';
import type { ForecastData, LocationData, WeatherData } from '../types';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  createdAt: Date;
  retryQuestion?: string;
}

const SUGGESTED_QUESTIONS = [
  'Will it rain soon?',
  'What should I wear?',
  'Is it good for a walk?',
];

function createMessage(
  role: ChatMessage['role'],
  text: string,
  retryQuestion?: string,
): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random()}`,
    role,
    text,
    createdAt: new Date(),
    retryQuestion,
  };
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function AIAssistantScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastUnavailable, setForecastUnavailable] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      'assistant',
      'Hi! I’m your WeatherWise assistant. Ask me about local weather, what to wear, or planning an outdoor activity.',
    ),
  ]);
  const [isAnswering, setIsAnswering] = useState(false);
  const sendingRef = useRef(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const loadWeatherContext = useCallback(async (isActive: () => boolean = () => true) => {
    setIsLoadingWeather(true);
    setLoadingError(null);

    try {
      let nextLocation: LocationData;
      try {
        const savedLocations = await listSavedLocations();
        const defaultLocation = savedLocations.find((saved) => saved.isDefault);
        nextLocation = defaultLocation
          ? {
              latitude: defaultLocation.latitude,
              longitude: defaultLocation.longitude,
              city: defaultLocation.label,
              region: '',
              country: '',
              displayName: defaultLocation.label,
            }
          : await getCurrentLocation();
      } catch {
        nextLocation = await getCurrentLocation();
      }

      if (!isActive()) return;
      const [currentWeather, forecastResult] = await Promise.allSettled([
        getCurrentWeather(nextLocation.latitude, nextLocation.longitude),
        getForecast(nextLocation.latitude, nextLocation.longitude),
      ]);

      if (!isActive()) return;
      if (currentWeather.status === 'rejected') throw currentWeather.reason;
      setLocation(nextLocation);
      setWeather(currentWeather.value);
      if (forecastResult.status === 'fulfilled') {
        setForecast(forecastResult.value);
        setForecastUnavailable(false);
      } else {
        setForecast(null);
        setForecastUnavailable(true);
      }
    } catch (error) {
      if (!isActive()) return;
      setLoadingError(error instanceof Error ? error.message : 'Could not load weather for the assistant.');
      setLocation(null);
      setWeather(null);
      setForecast(null);
    } finally {
      if (isActive()) setIsLoadingWeather(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadWeatherContext(() => active);
      return () => {
        active = false;
      };
    }, [loadWeatherContext]),
  );

  React.useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages, isAnswering]);

  const sendQuestion = useCallback(async (submittedQuestion: string, addUserMessage = true) => {
    const trimmedQuestion = submittedQuestion.trim();
    if (!trimmedQuestion || trimmedQuestion.length > 300 || sendingRef.current) return;
    if (!location || !weather) {
      setLoadingError('Current weather is required before the assistant can answer.');
      return;
    }

    sendingRef.current = true;
    setQuestion('');
    setIsAnswering(true);
    if (addUserMessage) {
      setMessages((current) => [...current, createMessage('user', trimmedQuestion)]);
    }

    try {
      const response = await askWeatherQuestion(trimmedQuestion, location, weather, forecast);
      setMessages((current) => [...current, createMessage('assistant', response.answer)]);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `I couldn't get an answer: ${error.message}`
        : 'I couldn’t get an answer right now. Please try again.';
      setMessages((current) => [
        ...current,
        createMessage('assistant', errorMessage, trimmedQuestion),
      ]);
    } finally {
      sendingRef.current = false;
      setIsAnswering(false);
    }
  }, [forecast, location, weather]);

  const retryQuestion = useCallback((message: ChatMessage) => {
    if (!message.retryQuestion) return;
    setMessages((current) => current.filter((item) => item.id !== message.id));
    void sendQuestion(message.retryQuestion, false);
  }, [sendQuestion]);

  const canSend = Boolean(location && weather) && !isLoadingWeather && !isAnswering && question.trim().length > 0;

  return (
    <ScreenContainer contentStyle={styles.screenContainer}>
      <KeyboardAvoidingView
        style={styles.layout}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headingRow}>
            <View style={styles.assistantIcon}>
              <Ionicons name="sparkles" size={22} color={COLORS.info} />
            </View>
            <View style={styles.headingCopy}>
              <Text style={styles.eyebrow}>WEATHERWISE ASSISTANT</Text>
              <Text style={styles.title}>Ask about your weather</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh weather"
              onPress={() => void loadWeatherContext()}
              disabled={isLoadingWeather}
              style={styles.refreshButton}
            >
              {isLoadingWeather
                ? <ActivityIndicator size="small" color={COLORS.info} />
                : <Ionicons name="refresh" size={20} color={COLORS.info} />}
            </Pressable>
          </View>
          {isLoadingWeather ? (
            <View style={styles.contextLine}>
              <ActivityIndicator size="small" color={COLORS.info} />
              <Text style={styles.contextText}>Getting your local weather...</Text>
            </View>
          ) : loadingError ? (
            <View style={styles.contextError} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={17} color={COLORS.warning} />
              <Text style={styles.contextErrorText}>{loadingError}</Text>
            </View>
          ) : (
            <View style={styles.contextLine}>
              <Ionicons name="location" size={16} color={COLORS.info} />
              <Text style={styles.contextText} numberOfLines={1}>
                {location?.displayName} · {Math.round(weather?.temperatureC ?? 0)}°C · {weather?.conditionLabel}
              </Text>
              {forecastUnavailable ? <Text style={styles.forecastNote}>No forecast</Text> : null}
            </View>
          )}
        </View>

        <FlatList
          ref={listRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          data={messages}
          keyExtractor={(message) => message.id}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.role === 'user' && styles.userMessageRow]}>
              {item.role === 'assistant' ? (
                <View style={styles.messageIcon}>
                  <Ionicons name="sparkles" size={16} color={COLORS.info} />
                </View>
              ) : null}
              <View style={styles.messageColumn}>
                <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
                    {item.text}
                  </Text>
                </View>
                <View style={[styles.messageMeta, item.role === 'user' && styles.userMessageMeta]}>
                  <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
                  {item.retryQuestion ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Retry question"
                      onPress={() => retryQuestion(item)}
                      style={styles.retryButton}
                    >
                      <Text style={styles.retryText}>↻ Try again</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={isAnswering ? (
            <View style={styles.thinkingBubble}>
              <ActivityIndicator size="small" color={COLORS.info} />
              <Text style={styles.contextText}>Checking the weather...</Text>
            </View>
          ) : null}
          ListEmptyComponent={null}
          ListHeaderComponent={messages.length === 1 ? (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsTitle}>TRY ASKING</Text>
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  accessibilityRole="button"
                  disabled={!weather || isLoadingWeather || isAnswering}
                  onPress={() => void sendQuestion(suggestion)}
                  style={[styles.suggestion, (!weather || isLoadingWeather) && styles.disabledSuggestion]}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Ionicons name="arrow-up" size={15} color={COLORS.info} />
                </Pressable>
              ))}
            </View>
          ) : null}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.composerWrap}>
          <View style={[styles.composer, !weather && styles.composerDisabled]}>
            <TextInput
              accessibilityLabel="Ask a weather question"
              style={styles.input}
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={() => void sendQuestion(question)}
              placeholder={isLoadingWeather ? 'Getting local weather...' : 'Ask about your weather...'}
              placeholderTextColor={COLORS.textSecondary}
              editable={Boolean(weather && !isLoadingWeather && !isAnswering)}
              maxLength={300}
              multiline
              returnKeyType="send"
              blurOnSubmit
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send question"
              disabled={!canSend}
              onPress={() => void sendQuestion(question)}
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            >
              <Ionicons name="arrow-up" size={21} color={COLORS.white} />
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>Weather guidance only · {question.length}/300</Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContainer: { padding: 0 },
  layout: { flex: 1, paddingHorizontal: SPACING.m },
  header: {
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  assistantIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: '#203C54',
    ...SHADOWS.subtle,
  },
  headingCopy: { flex: 1 },
  eyebrow: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 0.9 },
  title: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold, marginTop: 2 },
  refreshButton: { width: 38, height: 38, borderRadius: BORDER_RADIUS.round, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.backgroundCard },
  contextLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.s },
  contextText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, flexShrink: 1 },
  contextError: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.s },
  contextErrorText: { flex: 1, color: COLORS.warning, fontSize: TYPOGRAPHY.fontSize.xs },
  forecastNote: { color: COLORS.warning, fontSize: TYPOGRAPHY.fontSize.xs, marginLeft: 'auto' },
  messageList: { flex: 1 },
  messageContent: { flexGrow: 1, justifyContent: 'flex-end', paddingVertical: SPACING.m },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.m },
  userMessageRow: { justifyContent: 'flex-end' },
  messageIcon: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: '#203C54',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
    marginBottom: 20,
  },
  messageColumn: { maxWidth: '86%' },
  messageBubble: { paddingHorizontal: SPACING.m, paddingVertical: SPACING.s, borderRadius: BORDER_RADIUS.m },
  assistantBubble: { backgroundColor: COLORS.backgroundCard, borderBottomLeftRadius: BORDER_RADIUS.s },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: BORDER_RADIUS.s },
  assistantText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, lineHeight: 23 },
  userText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.m, lineHeight: 23 },
  messageMeta: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs },
  userMessageMeta: { justifyContent: 'flex-end' },
  timeText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs },
  retryButton: { marginLeft: SPACING.s, paddingHorizontal: SPACING.xs, paddingVertical: 2 },
  retryText: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  thinkingBubble: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, alignSelf: 'flex-start', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.m, padding: SPACING.m },
  suggestions: { gap: SPACING.xs, marginBottom: SPACING.l },
  suggestionsTitle: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 1, marginBottom: SPACING.xs },
  suggestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.backgroundCard, borderColor: COLORS.border, borderWidth: 1, borderRadius: BORDER_RADIUS.m, paddingHorizontal: SPACING.m, paddingVertical: SPACING.s },
  disabledSuggestion: { opacity: 0.5 },
  suggestionText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s },
  composerWrap: { paddingTop: SPACING.s, paddingBottom: SPACING.s, borderTopWidth: 1, borderTopColor: COLORS.border },
  composer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xs, minHeight: 50 },
  composerDisabled: { opacity: 0.65 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 21, maxHeight: 100, paddingHorizontal: SPACING.s, paddingVertical: SPACING.s },
  sendButton: { width: 38, height: 38, borderRadius: BORDER_RADIUS.round, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, marginLeft: SPACING.xs },
  sendButtonDisabled: { backgroundColor: COLORS.border },
  disclaimer: { textAlign: 'center', color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs },
});
