import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { ErrorView } from '../components/StateViews';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useLocation, useWeather } from '../hooks';
import { askAssistant } from '../services/weatherService';

export function AIAssistantScreen() {
  const location = useLocation();
  const weather = useWeather(location.data?.latitude ?? null, location.data?.longitude ?? null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!weather.data || !question.trim()) return;
    setLoading(true); setError(null); setAnswer(null);
    try { setAnswer((await askAssistant(question.trim(), weather.data)).answer); }
    catch (err) { setError(err instanceof Error ? err.message : 'The assistant is unavailable.'); }
    finally { setLoading(false); }
  };

  if (location.isLoading || (weather.isLoading && !weather.data)) return <ScreenContainer><LoadingPlaceholder message="Preparing weather context..." /></ScreenContainer>;
  if (location.error || weather.error || !weather.data) return <ScreenContainer><ErrorView message={location.error || weather.error || 'Weather is unavailable'} onRetry={weather.refresh} /></ScreenContainer>;
  return (
    <ScreenContainer scrollable>
      <Text style={styles.heading}>Ask WeatherWise</Text>
      <Text style={styles.copy}>Answers are grounded in the live conditions for {location.data?.city || 'your current location'}.</Text>
      <Card><Text style={styles.context}>{weather.data.conditionLabel} | {weather.data.temperatureC} deg | rain {weather.data.rainProbability}% | UV {weather.data.uvIndex}</Text></Card>
      <TextField label="Your question" value={question} onChangeText={setQuestion} placeholder="Can I go for a run this afternoon?" multiline numberOfLines={4} textAlignVertical="top" />
      <Button label="Ask assistant" onPress={submit} disabled={!question.trim()} loading={loading} />
      {error ? <ErrorView message={error} /> : null}
      {answer ? <Card style={styles.answer}><Text style={styles.answerLabel}>WeatherWise answer</Text><Text style={styles.answerText}>{answer}</Text></Card> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold, marginTop: SPACING.m },
  copy: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m, lineHeight: 22, marginTop: SPACING.s, marginBottom: SPACING.m },
  context: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s },
  answer: { marginTop: SPACING.l },
  answerLabel: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.semiBold, fontSize: TYPOGRAPHY.fontSize.s, marginBottom: SPACING.s },
  answerText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, lineHeight: 23 },
});
