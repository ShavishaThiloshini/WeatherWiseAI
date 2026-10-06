import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { askWeatherQuestion } from '../services/assistantService';
import { getCurrentLocation, listSavedLocations } from '../services/locationService';
import { getCurrentWeather, getForecast } from '../services/weatherService';
import type { ForecastData, LocationData, WeatherData } from '../types';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

const START_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Ask me about the weather, rain, what to wear, or whether it’s a good time to head outside.',
};

const SUGGESTED_QUESTIONS = [
  'Will it rain soon?',
  'What should I wear?',
  'Is it good for a walk?',
];

export function AIAssistantScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastUnavailable, setForecastUnavailable] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([START_MESSAGE]);
  const [isAnswering, setIsAnswering] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;

    const loadWeatherContext = async () => {
      setIsLoadingWeather(true);
      setLoadingError(null);
      try {
        const savedLocations = await listSavedLocations();
        const defaultLocation = savedLocations.find((saved) => saved.isDefault);
        const nextLocation = defaultLocation
          ? {
              latitude: defaultLocation.latitude,
              longitude: defaultLocation.longitude,
              city: defaultLocation.label,
              region: '',
              country: '',
              displayName: defaultLocation.label,
            }
          : await getCurrentLocation();
        const [currentWeather, forecastResult] = await Promise.allSettled([
          getCurrentWeather(nextLocation.latitude, nextLocation.longitude),
          getForecast(nextLocation.latitude, nextLocation.longitude),
        ]);

        if (!active) return;
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
        if (active) {
          setLoadingError(error instanceof Error ? error.message : 'Could not load weather for the assistant.');
          setLocation(null);
          setWeather(null);
          setForecast(null);
        }
      } finally {
        if (active) setIsLoadingWeather(false);
      }
    };

    void loadWeatherContext();
    return () => {
      active = false;
    };
  }, []));

  const sendQuestion = async (submittedQuestion = question) => {
    const trimmedQuestion = submittedQuestion.trim();
    if (!trimmedQuestion || isAnswering) return;
    if (trimmedQuestion.length > 300) {
      setMessages((current) => [...current, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: 'Please keep your question under 300 characters.',
      }]);
      return;
    }
    if (!location || !weather) {
      setMessages((current) => [...current, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: 'I need current weather data before I can answer. Please try again after the weather loads.',
      }]);
      return;
    }

    setQuestion('');
    setMessages((current) => [...current, {
      id: `question-${Date.now()}`,
      role: 'user',
      text: trimmedQuestion,
    }]);
    setIsAnswering(true);
    try {
      const response = await askWeatherQuestion(trimmedQuestion, location, weather, forecast);
      setMessages((current) => [...current, {
        id: `answer-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: error instanceof Error ? `I couldn't get an answer: ${error.message}` : 'I couldn’t get an answer right now. Please try again.',
      }]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
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
          </View>
          {isLoadingWeather ? (
            <View style={styles.contextLine}>
              <ActivityIndicator size="small" color={COLORS.info} />
              <Text style={styles.contextText}>Getting your local weather...</Text>
            </View>
          ) : loadingError ? (
            <View style={styles.contextError}>
              <Ionicons name="alert-circle-outline" size={17} color={COLORS.warning} />
              <Text style={styles.contextErrorText}>{loadingError}</Text>
            </View>
          ) : (
            <View style={styles.contextLine}>
              <Ionicons name="location" size={16} color={COLORS.info} />
              <Text style={styles.contextText} numberOfLines={1}>
                {location?.displayName} · {Math.round(weather?.temperatureC ?? 0)}°C · {weather?.conditionLabel}
              </Text>
              {forecastUnavailable && <Text style={styles.forecastNote}>No forecast</Text>}
            </View>
          )}
        </View>

        <ScrollView
          style={styles.messageScroll}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {message.role === 'assistant' && (
                <Ionicons name="sparkles" size={15} color={COLORS.info} style={styles.messageIcon} />
              )}
              <Text style={message.role === 'user' ? styles.userText : styles.assistantText}>
                {message.text}
              </Text>
            </View>
          ))}
          {isAnswering && (
            <View style={[styles.messageBubble, styles.assistantBubble, styles.thinkingBubble]}>
              <ActivityIndicator size="small" color={COLORS.info} />
              <Text style={styles.contextText}>Checking the weather...</Text>
            </View>
          )}
          {messages.length === 1 && (
            <View style={styles.suggestions}>
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  accessibilityRole="button"
                  disabled={isAnswering || isLoadingWeather || Boolean(loadingError)}
                  onPress={() => void sendQuestion(suggestion)}
                  style={styles.suggestion}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Ionicons name="arrow-up" size={15} color={COLORS.info} />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Ask a weather question"
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={() => void sendQuestion()}
            placeholder="Ask a weather question..."
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            returnKeyType="send"
            maxLength={300}
            editable={!isAnswering}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send question"
            disabled={!question.trim() || isAnswering || isLoadingWeather || Boolean(loadingError)}
            onPress={() => void sendQuestion()}
            style={[styles.sendButton, (!question.trim() || isAnswering || isLoadingWeather || Boolean(loadingError)) && styles.sendButtonDisabled]}
          >
            {isAnswering
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Ionicons name="arrow-up" size={21} color={COLORS.white} />}
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>Answers are based on the latest weather data available.</Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
  layout: { flex: 1 },
  header: { paddingHorizontal: SPACING.m, paddingTop: SPACING.m, paddingBottom: SPACING.s, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  assistantIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.m, backgroundColor: '#203C54' },
  headingCopy: { flex: 1 },
  eyebrow: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 0.9 },
  title: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold, marginTop: 2 },
  contextLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.s },
  contextText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, flexShrink: 1 },
  contextError: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.s },
  contextErrorText: { flex: 1, color: COLORS.warning, fontSize: TYPOGRAPHY.fontSize.xs },
  forecastNote: { color: COLORS.warning, fontSize: TYPOGRAPHY.fontSize.xs, marginLeft: 'auto' },
  messageScroll: { flex: 1 },
  messageList: { padding: SPACING.m, gap: SPACING.s, flexGrow: 1 },
  messageBubble: { maxWidth: '88%', flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.m, borderRadius: BORDER_RADIUS.m },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.backgroundCard, borderBottomLeftRadius: BORDER_RADIUS.s },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: BORDER_RADIUS.s },
  messageIcon: { marginRight: SPACING.xs, marginTop: 2 },
  assistantText: { flexShrink: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, lineHeight: 23 },
  userText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.m, lineHeight: 23 },
  thinkingBubble: { alignItems: 'center', gap: SPACING.s },
  suggestions: { alignSelf: 'stretch', gap: SPACING.s, marginTop: 'auto', paddingTop: SPACING.xl },
  suggestion: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.m, borderRadius: BORDER_RADIUS.m, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.backgroundCard },
  suggestionText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s },
  composer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, marginHorizontal: SPACING.m, marginTop: SPACING.s, padding: SPACING.xs, borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.backgroundCard },
  input: { flex: 1, minHeight: 44, paddingHorizontal: SPACING.m, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m },
  sendButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.primary },
  sendButtonDisabled: { opacity: 0.45 },
  disclaimer: { paddingHorizontal: SPACING.m, paddingVertical: SPACING.s, color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, textAlign: 'center' },
});
